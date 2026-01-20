import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  MessageCircle, 
  Smartphone, 
  QrCode, 
  ShoppingCart, 
  Bell, 
  Ticket, 
  MapPin,
  LayoutDashboard,
  Star,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import logoImage from '@/assets/logo_pedy.png';

interface ResellerData {
  id: string;
  name: string;
  referral_code: string;
  whatsapp: string | null;
  pricing_mode: string;
  price_basic: number;
  price_pro: number;
  price_pro_plus: number;
  sales_page_title: string | null;
  sales_page_subtitle: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  show_prices: boolean | null;
  custom_cta_text: string | null;
}

const DEFAULT_PRICES = {
  basic: 37,
  pro: 59.90,
  proPlus: 79.90
};

const features = [
  { icon: Smartphone, label: 'Cardápio Digital', included: ['basic', 'pro', 'proPlus'] },
  { icon: MessageCircle, label: 'Pedidos no WhatsApp', included: ['basic', 'pro', 'proPlus'] },
  { icon: QrCode, label: 'QR Code Personalizado', included: ['basic', 'pro', 'proPlus'] },
  { icon: LayoutDashboard, label: 'Dashboard de Pedidos', included: ['pro', 'proPlus'] },
  { icon: Bell, label: 'Notificações Push', included: ['pro', 'proPlus'] },
  { icon: Ticket, label: 'Cupons de Desconto', included: ['pro', 'proPlus'] },
  { icon: MapPin, label: 'Taxas por Bairro', included: ['pro', 'proPlus'] },
  { icon: Star, label: 'Multi-sabores Automático', included: ['proPlus'] },
  { icon: ShoppingCart, label: 'Analytics Avançado', included: ['proPlus'] },
];

const testimonials = [
  {
    name: 'Maria Silva',
    business: 'Pizzaria Bella',
    text: 'Aumentei minhas vendas em 40% depois que comecei a usar o cardápio digital!'
  },
  {
    name: 'João Santos',
    business: 'Hamburgueria Top',
    text: 'Acabou a bagunça de pedidos por áudio. Agora tudo organizado!'
  },
  {
    name: 'Ana Costa',
    business: 'Açaí Point',
    text: 'Meus clientes adoram a praticidade. Super recomendo!'
  }
];

const faqs = [
  {
    question: 'Preciso de conhecimento técnico?',
    answer: 'Não! O sistema é super simples. Em 5 minutos você monta seu cardápio.'
  },
  {
    question: 'Existe taxa por pedido?',
    answer: 'Não! Você paga apenas a mensalidade fixa. Zero taxa por pedido.'
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer: 'Sim! Sem fidelidade, sem multa. Cancele quando precisar.'
  },
  {
    question: 'Funciona no meu celular?',
    answer: 'Sim! Funciona em qualquer celular, tablet ou computador.'
  }
];

export default function ResellerSalesPage() {
  const { referralCode } = useParams<{ referralCode: string }>();
  const navigate = useNavigate();
  const [reseller, setReseller] = useState<ResellerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (referralCode) {
      fetchResellerData();
    }
  }, [referralCode]);

  const fetchResellerData = async () => {
    try {
      const { data, error } = await supabase
        .from('resellers')
        .select('*')
        .eq('referral_code', referralCode)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setReseller(data);
    } catch (error) {
      console.error('Error fetching reseller:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrices = () => {
    if (reseller?.pricing_mode === 'custom_price') {
      return {
        basic: reseller.price_basic,
        pro: reseller.price_pro,
        proPlus: reseller.price_pro_plus
      };
    }
    return DEFAULT_PRICES;
  };

  const handleCTA = () => {
    if (reseller?.pricing_mode === 'custom_price' && reseller.whatsapp) {
      const message = encodeURIComponent('Olá! Vi sua página do PEDY e quero saber mais sobre o cardápio digital.');
      window.open(`https://wa.me/55${reseller.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
    } else {
      navigate(`/cadastro?ref=${referralCode}`);
    }
  };

  const handleSecondaryAction = () => {
    if (reseller?.whatsapp) {
      const message = encodeURIComponent('Olá! Tenho dúvidas sobre o cardápio digital PEDY.');
      window.open(`https://wa.me/55${reseller.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reseller) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <h1 className="text-2xl font-bold text-foreground mb-4">Página não encontrada</h1>
        <p className="text-muted-foreground mb-6">Este link de revendedor não está disponível.</p>
        <Button onClick={() => navigate('/')}>Ir para página principal</Button>
      </div>
    );
  }

  const prices = getPrices();
  const primaryColor = reseller.primary_color || '#4A9BD9';
  const secondaryColor = reseller.secondary_color || '#4CAF50';
  const ctaText = reseller.custom_cta_text || (reseller.pricing_mode === 'custom_price' ? 'Falar com Consultor' : 'Criar Meu Cardápio Grátis');

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section 
        className="py-12 md:py-20 px-4"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}15 100%)` 
        }}
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src={reseller.logo_url || logoImage} 
              alt="Logo" 
              className="h-16 md:h-20 object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {reseller.sales_page_title || 'Seu Cardápio Digital em 5 Minutos'}
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {reseller.sales_page_subtitle || 'Venda mais pelo WhatsApp sem pagar taxas por pedido'}
          </p>

          {/* CTA */}
          <Button 
            size="lg" 
            onClick={handleCTA}
            className="text-lg px-8 py-6 rounded-full shadow-lg hover:scale-105 transition-transform"
            style={{ backgroundColor: primaryColor }}
          >
            {ctaText}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" /> 7 dias grátis
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" /> Sem taxa por pedido
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" /> Cancele quando quiser
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {(reseller.show_prices !== false) && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
              Escolha o Plano Ideal para Você
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Basic */}
              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">Básico</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                      {formatCurrency(prices.basic)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        {feature.included.includes('basic') ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span className={!feature.included.includes('basic') ? 'text-muted-foreground line-through' : ''}>
                          {feature.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Pro */}
              <Card className="relative overflow-hidden border-2" style={{ borderColor: primaryColor }}>
                <div 
                  className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  POPULAR
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">Pro</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                      {formatCurrency(prices.pro)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        {feature.included.includes('pro') ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span className={!feature.included.includes('pro') ? 'text-muted-foreground line-through' : ''}>
                          {feature.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Pro+ */}
              <Card className="relative overflow-hidden">
                <div 
                  className="absolute top-0 right-0 px-3 py-1 text-xs font-bold text-white rounded-bl-lg"
                  style={{ backgroundColor: secondaryColor }}
                >
                  COMPLETO
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">Pro+</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                      {formatCurrency(prices.proPlus)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature.label}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <Button 
                size="lg" 
                onClick={handleCTA}
                className="px-8"
                style={{ backgroundColor: primaryColor }}
              >
                {ctaText}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Tudo que Você Precisa para Vender Mais
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.slice(0, 6).map((feature, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.label}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            O Que Nossos Clientes Dizem
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Perguntas Frequentes
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <Collapsible 
                key={idx} 
                open={openFaq === idx} 
                onOpenChange={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="font-medium text-left">{faq.question}</span>
                      {openFaq === idx ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 px-4">
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section 
        className="py-16 px-4"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
        }}
      >
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para Aumentar suas Vendas?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Comece agora mesmo com 7 dias grátis. Sem cartão de crédito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={handleCTA}
              className="text-lg px-8"
            >
              {ctaText}
            </Button>
            {reseller.whatsapp && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleSecondaryAction}
                className="text-lg px-8 border-white text-white hover:bg-white/10"
              >
                <MessageCircle className="mr-2 w-5 h-5" />
                Tirar Dúvidas
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Powered by</span>
            <img src={logoImage} alt="PEDY" className="h-6" />
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PEDY - Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
