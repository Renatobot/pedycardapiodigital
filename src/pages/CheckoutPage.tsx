import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MapPin, CreditCard, Banknote, QrCode, Copy, Check, MessageCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency, generateOrderMessage, openWhatsApp, openPaymentWhatsApp } from '@/lib/whatsapp';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { isEstablishmentActive } from '@/lib/utils';

interface PublicEstablishment {
  id: string;
  name: string;
  logo_url: string | null;
  plan_status: string;
  trial_end_date: string;
  plan_expires_at: string | null;
}

interface EstablishmentContact {
  whatsapp: string;
  pix_key: string | null;
}

function CheckoutContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  
  const [establishment, setEstablishment] = useState<PublicEstablishment | null>(null);
  const [contact, setContact] = useState<EstablishmentContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [planStatus, setPlanStatus] = useState<{ active: boolean; reason: 'trial_expired' | 'plan_expired' | null }>({ active: true, reason: null });
  
  const [formData, setFormData] = useState({
    address: '',
    referencePoint: '',
    paymentMethod: 'pix',
    needsChange: false,
    changeFor: '',
    pixPaidInAdvance: false,
    observations: '',
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchEstablishment = async () => {
      if (!id) return;
      
      try {
        // Fetch public establishment data (no sensitive info)
        const { data, error } = await supabase
          .from('public_establishments')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error('Error fetching establishment:', error);
          toast({
            title: 'Erro',
            description: 'Estabelecimento não encontrado.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }
        
        setEstablishment(data as PublicEstablishment);
        
        // Check plan status
        const status = isEstablishmentActive({
          plan_status: data.plan_status || 'trial',
          trial_end_date: data.trial_end_date,
          plan_expires_at: data.plan_expires_at,
        });
        setPlanStatus(status);
        
        // Fetch contact info securely via function (only if plan is active)
        if (status.active) {
          const { data: contactData, error: contactError } = await supabase
            .rpc('get_establishment_contact', { establishment_id: id });
          
          if (!contactError && contactData && contactData.length > 0) {
            setContact(contactData[0] as EstablishmentContact);
          }
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEstablishment();
  }, [id, navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, paymentMethod: value, needsChange: false, changeFor: '' }));
  };

  const copyPixKey = () => {
    if (contact?.pix_key) {
      navigator.clipboard.writeText(contact.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getPaymentMethodLabel = () => {
    switch (formData.paymentMethod) {
      case 'cash': return 'Dinheiro';
      case 'card-credit': return 'Cartão de Crédito';
      case 'card-debit': return 'Cartão de Débito';
      case 'pix': return 'Pix';
      default: return '';
    }
  };

  const getPaymentDetails = () => {
    if (formData.paymentMethod === 'cash' && formData.needsChange) {
      return `💵 Precisa de troco para ${formatCurrency(Number(formData.changeFor))}`;
    }
    if (formData.paymentMethod === 'pix') {
      return formData.pixPaidInAdvance 
        ? '✅ Cliente pagou via Pix antecipado' 
        : '⏳ Pagará via Pix na entrega';
    }
    return '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!establishment || !contact) return;
    
    if (!formData.address) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha o endereço de entrega.',
        variant: 'destructive',
      });
      return;
    }

    const message = generateOrderMessage(
      establishment.name || '',
      items,
      formData.address,
      formData.referencePoint,
      getPaymentMethodLabel(),
      getPaymentDetails(),
      total,
      formData.observations
    );

    openWhatsApp(contact.whatsapp, message);
    clearCart();
    
    toast({
      title: 'Pedido enviado!',
      description: 'Seu pedido foi enviado para o WhatsApp do estabelecimento.',
    });

    navigate(`/cardapio/${id}`);
  };

  const handleActivatePlan = () => {
    if (establishment) {
      openPaymentWhatsApp(establishment.name || '', planStatus.reason === 'trial_expired');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Estabelecimento não encontrado</p>
            <Link to="/">
              <Button>Voltar ao início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Plan expired/inactive - show blocking screen
  if (!planStatus.active) {
    const isTrialExpired = planStatus.reason === 'trial_expired';
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <h2 className="text-xl font-semibold text-foreground">
              Cardápio Temporariamente Indisponível
            </h2>
            
            <p className="text-muted-foreground">
              {isTrialExpired 
                ? 'O período de teste deste estabelecimento expirou. Para continuar recebendo pedidos, é necessário ativar o Plano PRO.'
                : 'O plano deste estabelecimento precisa ser renovado para continuar recebendo pedidos.'
              }
            </p>
            
            <div className="pt-4 space-y-3">
              <Button 
                variant="whatsapp" 
                size="lg" 
                className="w-full"
                onClick={handleActivatePlan}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {isTrialExpired ? 'Ativar Plano PRO - R$ 37/mês' : 'Renovar Plano PRO - R$ 37/mês'}
              </Button>
              
              <Link to={`/cardapio/${id}`} className="block">
                <Button variant="outline" size="lg" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao cardápio
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Seu carrinho está vazio</p>
            <Link to={`/cardapio/${id}`}>
              <Button>Voltar ao cardápio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center gap-4 h-14">
          <Link to={`/cardapio/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-foreground">Finalizar pedido</h1>
        </div>
      </header>

      <main className="container py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" />
                Endereço de entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço completo *</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Rua, número, bairro, cidade..."
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referencePoint">Ponto de referência</Label>
                <Input
                  id="referencePoint"
                  name="referencePoint"
                  placeholder="Ex: Próximo ao mercado..."
                  value={formData.referencePoint}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-5 h-5 text-primary" />
                Forma de pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={handlePaymentChange}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                    <QrCode className="w-5 h-5 text-secondary" />
                    Pix
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <RadioGroupItem value="card-credit" id="card-credit" />
                  <Label htmlFor="card-credit" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Cartão de Crédito
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <RadioGroupItem value="card-debit" id="card-debit" />
                  <Label htmlFor="card-debit" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Cartão de Débito
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="w-5 h-5 text-secondary" />
                    Dinheiro
                  </Label>
                </div>
              </RadioGroup>

              {/* Pix details */}
              {formData.paymentMethod === 'pix' && contact?.pix_key && (
                <div className="mt-4 p-4 bg-secondary/10 rounded-xl border border-secondary/20">
                  <p className="text-sm font-medium text-foreground mb-2">Chave Pix do estabelecimento:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-card p-2 rounded text-sm break-all">
                      {contact.pix_key}
                    </code>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="icon"
                      onClick={copyPixKey}
                    >
                      {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm">Quando vai pagar?</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={formData.pixPaidInAdvance ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, pixPaidInAdvance: true }))}
                      >
                        Pagar agora
                      </Button>
                      <Button
                        type="button"
                        variant={!formData.pixPaidInAdvance ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, pixPaidInAdvance: false }))}
                      >
                        Na entrega
                      </Button>
                    </div>
                    {formData.pixPaidInAdvance && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Envie o comprovante junto com o pedido no WhatsApp.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Cash change */}
              {formData.paymentMethod === 'cash' && (
                <div className="mt-4 p-4 bg-muted rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      id="needsChange"
                      checked={formData.needsChange}
                      onChange={(e) => setFormData(prev => ({ ...prev, needsChange: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <Label htmlFor="needsChange" className="cursor-pointer">
                      Preciso de troco
                    </Label>
                  </div>
                  
                  {formData.needsChange && (
                    <div className="space-y-2">
                      <Label htmlFor="changeFor">Troco para quanto?</Label>
                      <Input
                        id="changeFor"
                        name="changeFor"
                        type="number"
                        placeholder="Ex: 50"
                        value={formData.changeFor}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="observations"
                placeholder="Alguma observação sobre o pedido ou entrega?"
                value={formData.observations}
                onChange={handleChange}
              />
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="text-foreground">
                      {formatCurrency(
                        (item.product.price + item.selectedAdditions.reduce((a, b) => a + b.price, 0)) * item.quantity
                      )}
                    </span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
        <Button 
          variant="whatsapp" 
          size="lg" 
          className="w-full"
          onClick={handleSubmit}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Enviar pedido via WhatsApp
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <CheckoutContent />;
}
