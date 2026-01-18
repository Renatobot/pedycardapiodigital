import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Loader2,
  Clock
} from 'lucide-react';
import { formatCurrency } from '@/lib/whatsapp';
import { useCart } from '@/contexts/CartContext';
import { Product, ProductAddition, Category } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { BusinessHour, BusinessStatus, checkBusinessStatus } from '@/lib/businessHours';

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
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
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
    addItem(product, quantity, selectedAdditions, observations);
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
          
          <Button variant="hero" size="lg" className="w-full" onClick={handleAddToCart}>
            Adicionar ao carrinho
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CartSheet() {
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const { id, slug } = useParams();
  
  if (itemCount === 0) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="hero" 
          size="lg" 
          className="fixed bottom-4 left-4 right-4 z-50 shadow-xl"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Ver carrinho ({itemCount})
          <span className="ml-auto">{formatCurrency(total)}</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Seu pedido</SheetTitle>
            <Button variant="ghost" size="sm" onClick={clearCart}>
              Limpar
            </Button>
          </div>
        </SheetHeader>
        
        <div className="space-y-4 overflow-auto max-h-[calc(85vh-200px)]">
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
                      onClick={() => removeItem(item.product.id)}
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
      </SheetContent>
    </Sheet>
  );
}

function MenuContent() {
  const { id, slug } = useParams();
  const [establishment, setEstablishment] = useState<PublicEstablishment | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [businessStatus, setBusinessStatus] = useState<BusinessStatus>({ isOpen: true, message: 'Aberto', todayHours: null, nextOpenInfo: null });
  const [loading, setLoading] = useState(true);

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
          setEstablishment(estData);
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
        
        // Mapear produtos para formato esperado
        setProducts(prodData?.map(p => ({
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
          }))
        })) || []);

        // Configurar horários de funcionamento
        if (hoursData) {
          setBusinessHours(hoursData);
          const status = checkBusinessStatus(
            hoursData,
            estData.allow_orders_when_closed || false,
            estData.scheduled_orders_message
          );
          setBusinessStatus(status);
        }
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      {/* Header */}
      <div className="bg-gradient-hero text-primary-foreground p-6 pt-8">
        <div className="container">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-card rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
              {establishment.logo_url ? (
                <img 
                  src={establishment.logo_url} 
                  alt={establishment.name || 'Logo'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{establishment.name}</h1>
              <Badge 
                variant="outline" 
                className={`mt-1 ${
                  businessStatus.isOpen 
                    ? 'bg-green-500/20 text-white border-green-400/30' 
                    : 'bg-red-500/20 text-white border-red-400/30'
                }`}
              >
                <Clock className="w-3 h-3 mr-1" />
                {businessStatus.message}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Categories Navigation */}
      <div className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="container overflow-x-auto">
          <div className="flex gap-2 py-3">
            {categories.map((category) => (
              <Button 
                key={category.id}
                variant="ghost" 
                size="sm"
                className="flex-shrink-0"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Products */}
      <main className="container py-6">
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryProducts = products.filter(p => p.categoryId === category.id && p.available);
            if (categoryProducts.length === 0) return null;
            
            return (
              <div key={category.id}>
                <h2 className="text-xl font-bold text-foreground mb-4">{category.name}</h2>
                <div className="grid gap-4">
                  {categoryProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      
      <CartSheet />
    </div>
  );
}

export default function MenuPage() {
  return <MenuContent />;
}
