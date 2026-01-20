import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X,
  ChevronRight,
  Clock,
  ChevronDown,
  MapPin,
  Package,
  Moon,
  Sun,
  Settings2,
  List,
  LayoutGrid,
  Sparkles,
  AlertTriangle,
  Heart,
  User
} from 'lucide-react';
import { formatCurrency } from '@/lib/whatsapp';
import { useCart } from '@/contexts/CartContext';
import { Product, ProductAddition, Category, SelectedProductOption } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { BusinessHour, BusinessStatus, checkBusinessStatus, formatBusinessHoursForDisplay, FormattedBusinessHours } from '@/lib/businessHours';
import { ProductOptionSelector } from '@/components/ProductOptionSelector';
import { ProductOptionGroup, ProductOption } from '@/components/ProductOptionGroupsManager';
import { useToast } from '@/hooks/use-toast';
import { hexToHsl } from '@/lib/colors';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { SplashScreen } from '@/components/SplashScreen';
import { useDynamicManifest } from '@/hooks/useDynamicManifest';
import { ProductCardSkeleton, ProductCardSkeletonGrid } from '@/components/ProductCardSkeleton';
import { MenuSearchBar } from '@/components/MenuSearchBar';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useCustomer } from '@/hooks/useCustomer';
import { FavoriteButton } from '@/components/FavoriteButton';
import { FavoritesSection } from '@/components/FavoritesSection';
import CustomerProfileModal from '@/components/CustomerProfileModal';
import CustomerIdentificationModal from '@/components/CustomerIdentificationModal';

interface PublicEstablishment {
  id: string;
  name: string | null;
  logo_url: string | null;
  plan_status: string | null;
  trial_end_date: string | null;
  plan_expires_at: string | null;
  slug: string | null;
  allow_orders_when_closed: boolean | null;
  scheduled_orders_message: string | null;
  accept_pickup: boolean | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_complement: string | null;
  show_address_on_menu: boolean | null;
  city: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  menu_theme: string | null;
  min_order_value: number | null;
}

interface ProductWithOptions extends Product {
  optionGroups?: ProductOptionGroup[];
  is_promotional?: boolean;
  original_price?: number;
  promotional_price?: number;
  unit_type?: string;
  subject_to_availability?: boolean;
  created_at?: string;
}

// Helper to check if product is new (created within last 7 days)
function isNewProduct(createdAt?: string): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

// Helper to get category emoji
function getCategoryEmoji(categoryName: string): string {
  const emojiMap: Record<string, string> = {
    'lanches': '🍔',
    'hamburgers': '🍔',
    'hambúrgueres': '🍔',
    'pizzas': '🍕',
    'pizza': '🍕',
    'bebidas': '🥤',
    'drinks': '🥤',
    'sobremesas': '🍰',
    'desserts': '🍰',
    'doces': '🍬',
    'salgados': '🥟',
    'açaí': '🍇',
    'acai': '🍇',
    'sorvetes': '🍦',
    'massas': '🍝',
    'carnes': '🥩',
    'frutos do mar': '🦐',
    'sushi': '🍣',
    'japonesa': '🍣',
    'saladas': '🥗',
    'combos': '🎁',
    'promoções': '🔥',
    'porções': '🍟',
    'petiscos': '🍿',
    'cafés': '☕',
    'sucos': '🧃',
  };
  
  const lowerName = categoryName.toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerName.includes(key)) return emoji;
  }
  return '🍽️';
}

interface ProductCardProps {
  product: ProductWithOptions;
  viewMode: 'list' | 'grid';
  onAddToCart: () => void;
}

function ProductCard({ product, viewMode, onAddToCart }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedAdditions, setSelectedAdditions] = useState<ProductAddition[]>([]);
  const [observations, setObservations] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<SelectedProductOption[]>([]);

  const toggleAddition = (addition: ProductAddition) => {
    setSelectedAdditions((prev) =>
      prev.find((a) => a.id === addition.id)
        ? prev.filter((a) => a.id !== addition.id)
        : [...prev, addition]
    );
  };

  const effectivePrice = product.is_promotional && product.promotional_price 
    ? product.promotional_price 
    : product.price;

  const additionsTotal = selectedAdditions.reduce((sum, a) => sum + a.price, 0);
  const optionsTotal = selectedOptions.reduce((sum, group) => 
    sum + group.options.reduce((oSum, opt) => oSum + opt.price, 0), 0
  );
  const itemTotal = (effectivePrice + additionsTotal + optionsTotal) * quantity;

  // Validation for required option groups
  const validateOptions = (): { valid: boolean; message?: string } => {
    if (!product.optionGroups || product.optionGroups.length === 0) {
      return { valid: true };
    }

    for (const group of product.optionGroups) {
      const selection = selectedOptions.find(s => s.groupId === group.id);
      const selectedCount = selection?.options.length || 0;

      if (group.is_required && selectedCount === 0) {
        return { valid: false, message: `Selecione ${group.name}` };
      }

      if (group.min_selections > 0 && selectedCount < group.min_selections) {
        return { valid: false, message: `Selecione pelo menos ${group.min_selections} em ${group.name}` };
      }
    }

    return { valid: true };
  };

  const handleAddToCart = () => {
    const validation = validateOptions();
    if (!validation.valid) {
      return;
    }

    addItem(product, quantity, selectedAdditions, observations, selectedOptions);
    
    toast({
      title: "Item adicionado!",
      description: `${quantity}x ${product.name} foi adicionado ao carrinho`,
    });
    
    onAddToCart();
    
    setIsOpen(false);
    setQuantity(1);
    setSelectedAdditions([]);
    setObservations('');
    setSelectedOptions([]);
  };

  if (!product.available) return null;

  const hasOptions = product.optionGroups && product.optionGroups.length > 0;
  const isNew = isNewProduct(product.created_at);

  // Grid view card
  if (viewMode === 'grid') {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden relative">
            {/* Badges */}
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              {isNew && (
                <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5">
                  <Sparkles className="w-3 h-3 mr-0.5" />
                  NOVO
                </Badge>
              )}
              {product.is_promotional && (
                <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 badge-shine">
                  🔥 PROMOÇÃO
                </Badge>
              )}
            </div>
            
            {/* Availability badge */}
            {product.subject_to_availability && (
              <div className="absolute top-2 right-2 z-10">
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/50">
                  <AlertTriangle className="w-3 h-3 mr-0.5" />
                  Disponibilidade
                </Badge>
              </div>
            )}
            
            <CardContent className="p-0">
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center">
                    <span className="text-4xl">{getCategoryEmoji(product.name)}</span>
                    <span className="text-xs text-muted-foreground mt-1">Sem foto</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[2rem]">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    {product.is_promotional && product.original_price ? (
                      <>
                        <span className="text-xs text-muted-foreground line-through">
                          {formatCurrency(product.original_price)}
                        </span>
                        <span className="font-bold text-red-500">
                          {formatCurrency(effectivePrice)}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-primary">
                        {formatCurrency(effectivePrice)}
                        {product.unit_type && product.unit_type !== 'Unidade' && (
                          <span className="text-xs font-normal text-muted-foreground">
                            /{product.unit_type.toLowerCase()}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {hasOptions && (
                      <Settings2 className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SheetTrigger>
        
        {/* Sheet content same for both views */}
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <ProductDetailSheet
            product={product}
            quantity={quantity}
            setQuantity={setQuantity}
            selectedAdditions={selectedAdditions}
            toggleAddition={toggleAddition}
            observations={observations}
            setObservations={setObservations}
            selectedOptions={selectedOptions}
            setSelectedOptions={setSelectedOptions}
            itemTotal={itemTotal}
            effectivePrice={effectivePrice}
            validateOptions={validateOptions}
            handleAddToCart={handleAddToCart}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // List view card (default)
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden relative">
          {/* Badges */}
          <div className="absolute top-2 left-2 z-10 flex gap-1">
            {isNew && (
              <Badge className="bg-green-500 text-white text-xs px-1.5 py-0.5">
                <Sparkles className="w-3 h-3 mr-0.5" />
                NOVO
              </Badge>
            )}
            {product.is_promotional && (
              <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 badge-shine">
                🔥 PROMOÇÃO
              </Badge>
            )}
          </div>
          
          <CardContent className="p-0">
            <div className="flex gap-3 p-3">
              <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center">
                    <span className="text-3xl">{getCategoryEmoji(product.name)}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">Sem foto</span>
                  </div>
                )}
                {/* Availability badge on image */}
                {product.subject_to_availability && (
                  <div className="absolute bottom-1 left-1">
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50/90 dark:bg-amber-950/90 px-1 py-0">
                      ⚠️ Disponibilidade
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
                    {hasOptions && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        <Settings2 className="w-2.5 h-2.5 mr-0.5" />
                        Personalizável
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {product.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {product.is_promotional && product.original_price ? (
                      <>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatCurrency(product.original_price)}
                        </span>
                        <span className="font-bold text-red-500">
                          {formatCurrency(effectivePrice)}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-primary">
                        {formatCurrency(effectivePrice)}
                        {product.unit_type && product.unit_type !== 'Unidade' && (
                          <span className="text-xs font-normal text-muted-foreground ml-0.5">
                            /{product.unit_type.toLowerCase()}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <Button size="sm" variant="secondary" className="h-8">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <ProductDetailSheet
          product={product}
          quantity={quantity}
          setQuantity={setQuantity}
          selectedAdditions={selectedAdditions}
          toggleAddition={toggleAddition}
          observations={observations}
          setObservations={setObservations}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          itemTotal={itemTotal}
          effectivePrice={effectivePrice}
          validateOptions={validateOptions}
          handleAddToCart={handleAddToCart}
        />
      </SheetContent>
    </Sheet>
  );
}

// Extracted sheet content component
interface ProductDetailSheetProps {
  product: ProductWithOptions;
  quantity: number;
  setQuantity: (q: number) => void;
  selectedAdditions: ProductAddition[];
  toggleAddition: (a: ProductAddition) => void;
  observations: string;
  setObservations: (o: string) => void;
  selectedOptions: SelectedProductOption[];
  setSelectedOptions: (o: SelectedProductOption[]) => void;
  itemTotal: number;
  effectivePrice: number;
  validateOptions: () => { valid: boolean; message?: string };
  handleAddToCart: () => void;
}

function ProductDetailSheet({
  product,
  quantity,
  setQuantity,
  selectedAdditions,
  toggleAddition,
  observations,
  setObservations,
  selectedOptions,
  setSelectedOptions,
  itemTotal,
  effectivePrice,
  validateOptions,
  handleAddToCart
}: ProductDetailSheetProps) {
  return (
    <>
      <SheetHeader className="pb-4">
        <SheetTitle className="text-left">{product.name}</SheetTitle>
      </SheetHeader>
      
      <div className="space-y-6 overflow-auto max-h-[calc(85vh-180px)]">
        <div className="w-full h-48 bg-muted rounded-xl flex items-center justify-center overflow-hidden relative">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex flex-col items-center justify-center">
              <span className="text-5xl">{getCategoryEmoji(product.name)}</span>
              <span className="text-sm text-muted-foreground mt-2">Sem foto</span>
            </div>
          )}
          
          {/* Badges in sheet */}
          <div className="absolute top-3 left-3 flex gap-2">
            {isNewProduct(product.created_at) && (
              <Badge className="bg-green-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                NOVO
              </Badge>
            )}
            {product.is_promotional && (
              <Badge className="bg-red-500 text-white badge-shine">
                🔥 PROMOÇÃO
              </Badge>
            )}
          </div>
        </div>
        
        <div>
          <p className="text-muted-foreground">{product.description}</p>
          
          {product.subject_to_availability && (
            <Badge variant="outline" className="mt-2 text-amber-600 border-amber-300">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Sujeito à disponibilidade
            </Badge>
          )}
          
          <div className="mt-2">
            {product.is_promotional && product.original_price ? (
              <div className="flex items-center gap-2">
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(product.original_price)}
                </span>
                <span className="text-xl font-bold text-red-500">
                  {formatCurrency(effectivePrice)}
                </span>
              </div>
            ) : (
              <p className="text-xl font-bold text-primary">
                {formatCurrency(effectivePrice)}
                {product.unit_type && product.unit_type !== 'Unidade' && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    /{product.unit_type.toLowerCase()}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Product Option Groups */}
        {product.optionGroups && product.optionGroups.length > 0 && (
          <ProductOptionSelector
            groups={product.optionGroups}
            selectedOptions={selectedOptions}
            onSelectionChange={setSelectedOptions}
          />
        )}
        
        {product.additions.length > 0 && (
          <div>
            <h4 className="font-semibold text-foreground mb-3">Adicionais</h4>
            <div className="space-y-2">
              {product.additions.map((addition) => (
                <div 
                  key={addition.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={addition.id}
                      checked={selectedAdditions.some((a) => a.id === addition.id)}
                      onCheckedChange={() => toggleAddition(addition)}
                    />
                    <Label htmlFor={addition.id} className="cursor-pointer">
                      {addition.name}
                    </Label>
                  </div>
                  <span className="text-sm font-medium text-secondary">
                    +{formatCurrency(addition.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <Label htmlFor="observations">Observações (opcional)</Label>
          <Textarea
            id="observations"
            placeholder="Ex: Sem cebola, bem passado..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="mt-2"
          />
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 bg-muted rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <span className="text-lg font-bold text-foreground">{formatCurrency(itemTotal)}</span>
        </div>
        
        {(() => {
          const validation = validateOptions();
          return (
            <Button 
              variant="hero" 
              size="lg" 
              className="w-full" 
              onClick={handleAddToCart}
              disabled={!validation.valid}
            >
              {validation.valid ? 'Adicionar ao carrinho' : validation.message}
            </Button>
          );
        })()}
      </div>
    </>
  );
}

function CartSheet({ isAnimating }: { isAnimating: boolean }) {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const { id, slug } = useParams();

  // Dynamic height based on item count
  const getSheetHeight = () => {
    if (itemCount === 0) return 'h-[50vh]';
    if (itemCount <= 2) return 'h-[55vh]';
    if (itemCount <= 4) return 'h-[70vh]';
    return 'h-[85vh]';
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant={itemCount > 0 ? "hero" : "outline"} 
          size="lg" 
          className={cn(
            "fixed bottom-4 left-4 right-4 z-50 shadow-xl transition-all",
            isAnimating && "animate-cart-bounce animate-cart-pulse"
          )}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {itemCount > 0 ? (
            <>
              Ver carrinho ({itemCount})
              <span className="ml-auto">{formatCurrency(total)}</span>
            </>
          ) : (
            "Carrinho vazio"
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className={cn("rounded-t-3xl transition-all", getSheetHeight())}>
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Seu pedido</SheetTitle>
            {itemCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Limpar
              </Button>
            )}
          </div>
        </SheetHeader>
        
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(50vh-150px)] text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Seu carrinho está vazio</h3>
            <p className="text-muted-foreground mt-2 max-w-xs">
              Adicione itens do cardápio para começar seu pedido
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 overflow-auto max-h-[calc(85vh-200px)]">
              {items.map((item, index) => {
                const additionsTotal = item.selectedAdditions.reduce((a, b) => a + b.price, 0);
                const optionsTotal = item.selectedOptions.reduce((sum, group) => 
                  sum + group.options.reduce((oSum, opt) => oSum + opt.price, 0), 0
                );
                const itemTotal = (item.product.price + additionsTotal + optionsTotal) * item.quantity;
                
                return (
                  <div 
                    key={`${item.product.id}-${index}`}
                    className="flex gap-3 p-3 bg-muted rounded-xl"
                  >
                    <div className="w-16 h-16 bg-background rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <span className="text-2xl">{getCategoryEmoji(item.product.name)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-foreground text-sm">{item.product.name}</h4>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 -mr-2 -mt-1"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Display selected options */}
                      {item.selectedOptions.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                          {item.selectedOptions.map((group) => (
                            <p key={group.groupId}>
                              <span className="font-medium">{group.groupName}:</span>{' '}
                              {group.options.map(o => o.name).join(', ')}
                              {group.options.some(o => o.price > 0) && (
                                <span className="text-secondary ml-1">
                                  (+{formatCurrency(group.options.reduce((sum, o) => sum + o.price, 0))})
                                </span>
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {item.selectedAdditions.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          + {item.selectedAdditions.map(a => a.name).join(', ')}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-background rounded-md p-0.5">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="font-semibold text-primary text-sm">
                          {formatCurrency(itemTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span>
              </div>
              
              <Link to={`/${slug || id}/checkout`}>
                <Button variant="hero" size="lg" className="w-full">
                  Continuar para entrega
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MenuContent() {
  const { id, slug } = useParams();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [establishment, setEstablishment] = useState<PublicEstablishment | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductWithOptions[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [businessStatus, setBusinessStatus] = useState<BusinessStatus>({ isOpen: true, message: 'Aberto', todayHours: null, nextOpenInfo: null });
  const [formattedHours, setFormattedHours] = useState<FormattedBusinessHours[]>([]);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  
  // New states for improvements
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cartAnimating, setCartAnimating] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showIdentificationModal, setShowIdentificationModal] = useState(false);
  
  // Customer hook for profile access
  const { customer, isLoggedIn } = useCustomer();
  
  // Refs for intersection observer
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Verificar se deve mostrar splash (PWA ou primeira visita)
  const isPWA = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
  const isFirstVisit = typeof window !== 'undefined' && !sessionStorage.getItem('pedy-menu-visited');

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pedy-menu-visited', 'true');
    }
  }, []);

  // Handle cart animation
  const handleAddToCart = useCallback(() => {
    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 600);
  }, []);

  // Scroll to category
  const scrollToCategory = useCallback((categoryId: string) => {
    const element = categoryRefs.current.get(categoryId);
    if (element) {
      const yOffset = -120; // Account for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  // Intersection observer for active category
  useEffect(() => {
    if (!mounted || categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const categoryId = entry.target.getAttribute('data-category-id');
            if (categoryId) {
              setActiveCategory(categoryId);
            }
          }
        });
      },
      {
        rootMargin: '-120px 0px -60% 0px',
        threshold: 0
      }
    );

    categoryRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [mounted, categories]);

  // Manifest dinâmico com dados do estabelecimento
  useDynamicManifest(establishment ? {
    name: establishment.name || 'Cardápio',
    shortName: (establishment.name || 'Cardápio').substring(0, 12),
    description: `Cardápio digital de ${establishment.name}`,
    startUrl: `/${establishment.slug || id}`,
    iconUrl: establishment.logo_url || undefined,
    themeColor: establishment.primary_color || '#4A9BD9',
    backgroundColor: '#ffffff'
  } : null);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply custom colors from establishment
  useEffect(() => {
    if (establishment) {
      const primaryColor = establishment.primary_color || '#4A9BD9';
      const secondaryColor = establishment.secondary_color || '#4CAF50';
      
      document.documentElement.style.setProperty('--menu-primary', hexToHsl(primaryColor));
      document.documentElement.style.setProperty('--menu-secondary', hexToHsl(secondaryColor));
      
      // Apply establishment's default theme preference if not set by user
      if (establishment.menu_theme && establishment.menu_theme !== 'system') {
        const storedTheme = localStorage.getItem('theme');
        if (!storedTheme) {
          setTheme(establishment.menu_theme);
        }
      }
    }
    
    // Cleanup on unmount
    return () => {
      document.documentElement.style.removeProperty('--menu-primary');
      document.documentElement.style.removeProperty('--menu-secondary');
    };
  }, [establishment, setTheme]);

  useEffect(() => {
    const fetchData = async () => {
      const identifier = slug || id;
      if (!identifier) return;
      
      // Verificar se é UUID ou slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      try {
        // Buscar estabelecimento da view pública por id ou slug
        const { data: estData, error: estError } = await supabase
          .from('public_establishments')
          .select('*')
          .eq(isUUID ? 'id' : 'slug', identifier)
          .single();
        
        if (estError) {
          console.error('Erro ao buscar estabelecimento:', estError);
        } else if (estData) {
          setEstablishment(estData as unknown as PublicEstablishment);
        }
        
        const establishmentId = estData?.id;
        if (!establishmentId) {
          setLoading(false);
          return;
        }
        
        // Buscar categorias
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .eq('establishment_id', establishmentId)
          .order('sort_order', { ascending: true });
        
        // Buscar produtos com adicionais
        const { data: prodData } = await supabase
          .from('products')
          .select(`
            *,
            product_additions (*)
          `)
          .eq('establishment_id', establishmentId);
        
        // Buscar grupos de opções e suas opções
        const { data: optionGroupsData } = await supabase
          .from('product_option_groups')
          .select(`
            *,
            product_options (*)
          `)
          .in('product_id', (prodData || []).map(p => p.id))
          .order('sort_order', { ascending: true });
        
        // Buscar horários de funcionamento
        const { data: hoursData } = await supabase
          .from('business_hours')
          .select('*')
          .eq('establishment_id', establishmentId);
        
        // Mapear categorias para formato esperado
        setCategories(catData?.map(c => ({
          id: c.id,
          establishmentId: c.establishment_id,
          name: c.name,
          order: c.sort_order
        })) || []);
        
        // Set first category as active
        if (catData && catData.length > 0) {
          setActiveCategory(catData[0].id);
        }
        
        // Mapear produtos para formato esperado com grupos de opções
        setProducts(prodData?.map(p => {
          // Find option groups for this product
          const productGroups = (optionGroupsData || [])
            .filter(g => g.product_id === p.id)
            .map(g => ({
              id: g.id,
              name: g.name,
              type: g.type as 'single' | 'multiple' | 'flavor',
              is_required: g.is_required || false,
              min_selections: g.min_selections || 0,
              max_selections: g.max_selections || 1,
              sort_order: g.sort_order || 0,
              options: (g.product_options || [])
                .filter((o: any) => o.is_available !== false)
                .map((o: any) => ({
                  id: o.id,
                  name: o.name,
                  price: Number(o.price) || 0,
                  is_default: o.is_default || false,
                  is_available: o.is_available !== false,
                  sort_order: o.sort_order || 0
                }))
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
            }));

          return {
            id: p.id,
            categoryId: p.category_id,
            establishmentId: p.establishment_id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price),
            image: p.image_url,
            available: p.available,
            additions: (p.product_additions || []).map((a: any) => ({
              id: a.id,
              name: a.name,
              price: Number(a.price)
            })),
            optionGroups: productGroups,
            // New fields
            is_promotional: p.is_promotional || false,
            original_price: p.original_price ? Number(p.original_price) : undefined,
            promotional_price: p.promotional_price ? Number(p.promotional_price) : undefined,
            unit_type: p.unit_type || 'Unidade',
            subject_to_availability: p.subject_to_availability || false,
            created_at: p.created_at
          };
        }) || []);

        // Configurar horários de funcionamento
        if (hoursData) {
          setBusinessHours(hoursData);
          const status = checkBusinessStatus(
            hoursData,
            (estData as any).allow_orders_when_closed || false,
            (estData as any).scheduled_orders_message
          );
          setBusinessStatus(status);
          
          // Format hours for display
          const formatted = formatBusinessHoursForDisplay(hoursData);
          setFormattedHours(formatted);
        }

        // Salvar slug/id no sessionStorage para fallback do PWA no iOS
        const currentPath = window.location.pathname;
        if (currentPath && currentPath !== '/') {
          sessionStorage.setItem('pwa-last-menu', currentPath);
          localStorage.setItem('pwa-start-url', currentPath);
        }
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, slug]);

  // Filter products by search term
  const filteredProducts = searchTerm
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  // Mostrar splash apenas em PWA ou primeira visita, enquanto carrega ou logo após
  if ((isPWA || isFirstVisit) && showSplash) {
    return (
      <SplashScreen 
        establishmentName={establishment?.name || undefined}
        onComplete={handleSplashComplete}
        duration={2500}
      />
    );
  }

  // Skeleton loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Skeleton Header */}
        <div className="bg-gradient-to-br from-primary to-secondary text-white p-4 pb-6">
          <div className="container">
            <div className="flex flex-col items-center text-center mt-8">
              <div className="w-36 h-36 bg-white/20 rounded-2xl animate-pulse" />
              <div className="h-6 w-48 bg-white/20 rounded mt-3 animate-pulse" />
              <div className="h-5 w-24 bg-white/20 rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Skeleton Categories */}
        <div className="sticky top-0 z-40 bg-card border-b border-border">
          <div className="container overflow-x-auto">
            <div className="flex gap-2 py-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-20 bg-muted rounded-md animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>
        
        {/* Skeleton Products */}
        <main className="container py-6">
          <div className="space-y-8">
            {[1, 2].map((section) => (
              <div key={section}>
                <div className="h-6 w-32 bg-muted rounded mb-4 animate-pulse" />
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Estabelecimento não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O cardápio que você está procurando não existe ou foi removido.
            </p>
            <Link to="/">
              <Button>Voltar ao início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Redesigned */}
      <div className="bg-menu-gradient text-white p-4 pb-6">
        <div className="container">
          {/* Top bar with theme toggle and profile */}
          <div className="flex justify-between items-center">
            {/* Profile button */}
            {isLoggedIn ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileModal(true)}
                className="text-white hover:bg-white/20 gap-2"
              >
                <User className="h-5 w-5" />
                <span className="text-sm max-w-[100px] truncate">{customer?.name?.split(' ')[0]}</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIdentificationModal(true)}
                className="text-white hover:bg-white/20 gap-1"
              >
                <User className="h-4 w-4" />
                <span className="text-sm">Entrar</span>
              </Button>
            )}
            
            {/* Theme toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="text-white hover:bg-white/20"
                title={resolvedTheme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
          
          {/* Logo e Nome - Centralizados */}
          <div className="flex flex-col items-center text-center mt-2">
            <div className="w-36 h-36 bg-card rounded-2xl flex items-center justify-center overflow-hidden shadow-xl border-2 border-white/20">
              {establishment.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name || 'Logo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-14 h-14 text-muted-foreground" />
              )}
            </div>
            
            <h1 className="text-2xl font-bold mt-3">{establishment.name}</h1>
            
            <Badge 
              variant="outline" 
              className={`mt-2 ${
                businessStatus.isOpen 
                  ? 'bg-green-500/20 text-white border-green-400/30' 
                  : 'bg-red-500/20 text-white border-red-400/30'
              }`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {businessStatus.message}
            </Badge>
          </div>
          
          {/* Informações Secundárias - Linha Compacta */}
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap text-sm">
            {/* Horários */}
            {formattedHours.length > 0 && (
              <Collapsible open={hoursOpen} onOpenChange={setHoursOpen}>
                <CollapsibleTrigger className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-colors">
                  <Clock className="w-3 h-3" />
                  Ver horários
                  <ChevronDown className={`w-4 h-4 transition-transform ${hoursOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-3">
                  <div className="bg-white/10 rounded-lg p-3 text-sm space-y-1">
                    {formattedHours.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-primary-foreground/80">{item.label}</span>
                        <span className={item.isOpen ? 'text-white font-medium' : 'text-white/60'}>
                          {item.isOpen ? item.hours : 'Fechado'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* Badge retirada */}
            {establishment.accept_pickup && (
              <Badge 
                variant="outline" 
                className="text-xs bg-green-500/20 text-white border-green-400/30"
              >
                <Package className="w-3 h-3 mr-1" />
                Retirada
              </Badge>
            )}
          </div>
          
          {/* Pedido Mínimo */}
          {establishment.min_order_value && establishment.min_order_value > 0 && (
            <div className="text-center mt-3">
              <span className="text-sm bg-white/10 rounded-full px-3 py-1 inline-flex items-center gap-1">
                💰 Pedido mínimo: {formatCurrency(establishment.min_order_value)}
              </span>
            </div>
          )}
          
          {/* Endereço - Compacto */}
          {establishment.accept_pickup && establishment.show_address_on_menu && establishment.address_street && (
            <div className="mt-3 text-center text-sm opacity-90">
              <div className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>
                  {establishment.address_street}, {establishment.address_number}
                  {establishment.address_complement && ` - ${establishment.address_complement}`}
                  {' - '}{establishment.address_neighborhood}
                  {establishment.city && `, ${establishment.city}`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="container py-3">
        <MenuSearchBar onSearch={setSearchTerm} />
      </div>
      
      {/* Categories Navigation with active state */}
      <div className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 py-3">
            {categories.map((category) => (
              <Button 
                key={category.id}
                variant={activeCategory === category.id ? "default" : "ghost"} 
                size="sm"
                className={cn(
                  "flex-shrink-0 transition-all",
                  activeCategory === category.id && "shadow-md"
                )}
                onClick={() => scrollToCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* View Mode Toggle */}
      <div className="container pt-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {filteredProducts.filter(p => p.available).length} produtos
        </span>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'ghost'} 
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'ghost'} 
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Products */}
      <main className="container py-4">
        {searchTerm ? (
          // Search results
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Resultados para "{searchTerm}"
            </h2>
            {filteredProducts.filter(p => p.available).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum produto encontrado</p>
                </CardContent>
              </Card>
            ) : (
              <div className={cn(
                "gap-4",
                viewMode === 'grid' ? 'grid grid-cols-2' : 'grid'
              )}>
                {filteredProducts
                  .filter(p => p.available)
                  .map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      viewMode={viewMode}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
              </div>
            )}
          </div>
        ) : (
          // Normal category view
          <div className="space-y-8">
            {categories.map((category) => {
              const categoryProducts = filteredProducts.filter(p => p.categoryId === category.id && p.available);
              
              return (
                <div 
                  key={category.id}
                  ref={(el) => {
                    if (el) categoryRefs.current.set(category.id, el);
                  }}
                  data-category-id={category.id}
                >
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="text-2xl">{getCategoryEmoji(category.name)}</span>
                    {category.name}
                  </h2>
                  
                  {categoryProducts.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Novidades em breve...</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className={cn(
                      "gap-4",
                      viewMode === 'grid' ? 'grid grid-cols-2' : 'grid'
                    )}>
                      {categoryProducts.map((product) => (
                        <ProductCard 
                          key={product.id} 
                          product={product} 
                          viewMode={viewMode}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      <CartSheet isAnimating={cartAnimating} />
      <PWAInstallPrompt 
        establishmentName={establishment?.name}
        establishmentLogo={establishment?.logo_url}
      />
      
      {/* Customer Profile Modal */}
      <CustomerProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        establishmentId={establishment?.id}
      />
      
      {/* Customer Identification Modal */}
      <CustomerIdentificationModal
        open={showIdentificationModal}
        onOpenChange={setShowIdentificationModal}
        establishmentName={establishment?.name || ''}
      />
    </div>
  );
}

export default function MenuPage() {
  return <MenuContent />;
}
