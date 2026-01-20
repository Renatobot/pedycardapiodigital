import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  MapPin,
  Moon,
  Sun,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '@/lib/whatsapp';
import { Product, ProductAddition } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { mockEstablishment, mockCategories, mockProducts } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  product: Product;
  quantity: number;
  selectedAdditions: ProductAddition[];
  observations: string;
}

function DemoProductCard({ 
  product, 
  onAddToCart 
}: { 
  product: Product; 
  onAddToCart: (product: Product, quantity: number, additions: ProductAddition[], observations: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedAdditions, setSelectedAdditions] = useState<ProductAddition[]>([]);
  const [observations, setObservations] = useState('');

  const toggleAddition = (addition: ProductAddition) => {
    setSelectedAdditions((prev) =>
      prev.find((a) => a.id === addition.id)
        ? prev.filter((a) => a.id !== addition.id)
        : [...prev, addition]
    );
  };

  const additionsTotal = selectedAdditions.reduce((sum, a) => sum + a.price, 0);
  const itemTotal = (product.price + additionsTotal) * quantity;

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedAdditions, observations);
    setIsOpen(false);
    setQuantity(1);
    setSelectedAdditions([]);
    setObservations('');
  };

  if (!product.available) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
          <CardContent className="p-0">
            <div className="flex gap-3 p-3">
              <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {product.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-bold text-primary">{formatCurrency(product.price)}</p>
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
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">{product.name}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 overflow-auto max-h-[calc(85vh-180px)]">
          <div className="w-full h-48 bg-muted rounded-xl flex items-center justify-center overflow-hidden">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          
          <div>
            <p className="text-muted-foreground">{product.description}</p>
            <p className="text-xl font-bold text-primary mt-2">{formatCurrency(product.price)}</p>
          </div>
          
          {product.additions && product.additions.length > 0 && (
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
          
          <Button 
            variant="hero" 
            size="lg" 
            className="w-full" 
            onClick={handleAddToCart}
          >
            Adicionar ao carrinho
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DemoCartSheet({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart 
}: { 
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}) {
  const navigate = useNavigate();
  const total = items.reduce((sum, item) => {
    const additionsTotal = item.selectedAdditions.reduce((a, b) => a + b.price, 0);
    return sum + (item.product.price + additionsTotal) * item.quantity;
  }, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    navigate('/cadastro');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant={itemCount > 0 ? "hero" : "outline"} 
          size="lg" 
          className="fixed bottom-4 left-4 right-4 z-50 shadow-xl"
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
      
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Seu pedido</SheetTitle>
            {itemCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearCart}>
                Limpar
              </Button>
            )}
          </div>
        </SheetHeader>
        
        {itemCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(85vh-200px)] text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Seu carrinho está vazio</h3>
            <p className="text-muted-foreground mt-2 max-w-xs">
              Adicione itens do cardápio para começar seu pedido
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 overflow-auto max-h-[calc(85vh-280px)]">
              {items.map((item, index) => {
                const additionsTotal = item.selectedAdditions.reduce((a, b) => a + b.price, 0);
                const itemTotal = (item.product.price + additionsTotal) * item.quantity;
                
                return (
                  <div 
                    key={`${item.product.id}-${index}`}
                    className="flex gap-3 p-3 bg-muted rounded-xl"
                  >
                    <div className="w-16 h-16 bg-background rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-foreground text-sm">{item.product.name}</h4>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 -mr-2 -mt-1"
                          onClick={() => onRemoveItem(item.product.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
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
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
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
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
                  🎯 Esta é uma demonstração. Crie sua conta para fazer pedidos reais!
                </p>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span>
              </div>
              
              <Button variant="hero" size="lg" className="w-full" onClick={handleCheckout}>
                Criar meu cardápio grátis
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default function DemoPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const handleAddToCart = (product: Product, quantity: number, additions: ProductAddition[], observations: string) => {
    setCartItems(prev => [...prev, { product, quantity, selectedAdditions: additions, observations }]);
    toast({
      title: "Item adicionado!",
      description: `${quantity}x ${product.name} foi adicionado ao carrinho`,
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground p-3 text-center sticky top-0 z-40">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">Demonstração do PEDY</span>
          <span className="text-sm opacity-90">•</span>
          <Link to="/cadastro" className="text-sm font-bold underline hover:no-underline">
            Criar meu cardápio grátis →
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-12 z-30">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center overflow-hidden">
                <Store className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{mockEstablishment.name}</h1>
                <Badge variant="secondary" className="mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  Aberto
                </Badge>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>Rua Exemplo, 123 - Centro, São Paulo</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <Clock className="w-3 h-3 inline mr-1" />
            Seg a Sex: 08:00 - 22:00 • Sáb e Dom: 09:00 - 23:00
          </p>
        </div>
      </div>

      {/* Categories and Products */}
      <div className="p-4 space-y-6">
        {mockCategories.map((category) => {
          const categoryProducts = mockProducts.filter(p => p.categoryId === category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category.id}>
              <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                {category.name}
              </h2>
              <div className="space-y-3">
                {categoryProducts.map((product) => (
                  <DemoProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Section */}
      <div className="p-4 bg-muted/50 border-t border-border">
        <div className="text-center max-w-md mx-auto">
          <h3 className="text-lg font-bold text-foreground mb-2">
            Gostou do que viu?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crie seu cardápio digital em menos de 5 minutos. 
            Teste grátis por 7 dias, sem cartão de crédito!
          </p>
          <Link to="/cadastro">
            <Button variant="hero" size="lg" className="w-full">
              Criar meu cardápio grátis
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Cart Sheet */}
      <DemoCartSheet 
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
