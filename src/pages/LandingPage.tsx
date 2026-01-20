import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import pedyLogo from '@/assets/logo_pedy.png';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from 'embla-carousel-autoplay';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ShoppingBag, 
  Smartphone, 
  MessageCircle, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Store,
  CreditCard,
  Users,
  Percent,
  MapPin,
  QrCode,
  Package,
  Tag,
  Clock,
  Quote,
  Star,
  HelpCircle,
  Shield,
  TrendingUp,
  Pizza,
  Coffee,
  IceCream,
  PawPrint,
  Pill,
  ShoppingCart,
  Flower,
  UtensilsCrossed,
  X,
  Check,
  Folder,
  LogIn
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { NICHE_TEMPLATES } from '@/lib/nicheTemplates';
import { AnimatedText } from '@/components/AnimatedText';
import { ScrollReveal } from '@/components/ScrollReveal';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { supabase } from '@/integrations/supabase/client';
import { SUPPORT_WHATSAPP } from '@/lib/whatsapp';

// Detect if running as PWA (standalone mode)
const isPWAMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

const features = [
  {
    icon: Store,
    title: 'Cardápio Digital',
    description: 'Crie seu cardápio online com fotos, descrições e preços atualizados em tempo real.',
  },
  {
    icon: ShoppingBag,
    title: 'Carrinho Inteligente',
    description: 'Seus clientes montam o pedido completo com adicionais e observações.',
  },
  {
    icon: MessageCircle,
    title: 'Pedidos via WhatsApp',
    description: 'Sem áudios, sem conversas perdidas. O cliente monta o pedido no cardápio e você recebe tudo completo, organizado e pronto para preparar.',
  },
  {
    icon: CreditCard,
    title: 'Formas de Pagamento',
    description: 'Aceite Pix, cartão ou dinheiro. Tudo configurável no seu painel.',
  },
];

const advancedFeatures = [
  {
    icon: Percent,
    title: 'Cupons de Desconto',
    description: 'Crie códigos promocionais com valores fixos ou percentuais para fidelizar clientes.',
  },
  {
    icon: MapPin,
    title: 'Taxa por Bairro',
    description: 'Configure taxas de entrega diferentes para cada região da sua cidade.',
  },
  {
    icon: Package,
    title: 'Gestão de Pedidos',
    description: 'Acompanhe cada pedido em tempo real: recebido, em preparo, a caminho e entregue.',
  },
  {
    icon: QrCode,
    title: 'QR Code do Cardápio',
    description: 'Gere e imprima o QR Code do seu cardápio para colocar na mesa ou vitrine.',
  },
  {
    icon: Tag,
    title: 'Produtos em Promoção',
    description: 'Destaque ofertas com preço original riscado e valor promocional.',
  },
  {
    icon: Clock,
    title: 'Endereços Salvos',
    description: 'Seus clientes não precisam digitar o endereço toda vez. Salvamos automaticamente!',
  },
];

const benefits = [
  'Teste grátis por 7 dias',
  'Sem taxa por pedido',
  'Cupons de desconto ilimitados',
  'Taxa de entrega por bairro',
  'QR Code do cardápio',
  'Gestão de pedidos em tempo real',
  'Suporte via WhatsApp',
  'Atualizações gratuitas',
];

const testimonials = [
  {
    name: 'Carlos Silva',
    business: 'Pizzaria Bella Napoli',
    city: 'São Paulo, SP',
    text: 'Antes eu anotava tudo no papel e sempre dava confusão. Com o PEDY, os pedidos chegam certinhos no WhatsApp. Meus clientes adoram!',
    rating: 5,
  },
  {
    name: 'Ana Paula Ferreira',
    business: 'Açaí da Praia',
    city: 'Rio de Janeiro, RJ',
    text: 'Em uma semana já vi o resultado. Os clientes pedem sozinhos pelo cardápio e não preciso ficar respondendo um por um. Tempo é dinheiro!',
    rating: 5,
  },
  {
    name: 'Roberto Mendes',
    business: 'Burger House',
    city: 'Belo Horizonte, MG',
    text: 'O sistema de cupons e taxa por bairro me ajudou a organizar as entregas. Recomendo para qualquer lanchonete que quer crescer.',
    rating: 5,
  },
  {
    name: 'Juliana Costa',
    business: 'Marmitaria Sabor Caseiro',
    city: 'Curitiba, PR',
    text: 'Simples de usar e meus clientes aprenderam rápido. O QR Code na porta do restaurante traz pedidos todo dia!',
    rating: 5,
  },
  {
    name: 'Marcos Oliveira',
    business: 'Pet Shop Amigo Fiel',
    city: 'Brasília, DF',
    text: 'Nem imaginava que um pet shop poderia usar cardápio digital. Agora meus clientes pedem ração e produtos pelo celular. Revolucionou meu negócio!',
    rating: 5,
  },
  {
    name: 'Fernanda Lima',
    business: 'Doceria Doce Mel',
    city: 'Salvador, BA',
    text: 'O suporte é incrível! Me ajudaram a configurar tudo em minutos. Agora recebo encomendas de bolos e doces organizadas direto no WhatsApp.',
    rating: 5,
  },
];

const stats = [
  { value: 500, label: 'Estabelecimentos ativos', suffix: '+' },
  { value: 50000, label: 'Pedidos enviados', suffix: '+', decimals: 0 },
  { value: 0, label: 'Taxa por pedido · Sem comissão', prefix: 'R$ ', suffix: '', decimals: 0 },
  { value: 5, label: 'Minutos para criar seu cardápio', suffix: ' min', decimals: 0 },
];

const segments = [
  { icon: Pizza, name: 'Pizzarias e Hamburguerias' },
  { icon: Coffee, name: 'Cafeterias e Padarias' },
  { icon: UtensilsCrossed, name: 'Restaurantes e Marmitarias' },
  { icon: IceCream, name: 'Açaiterias e Sorveterias' },
  { icon: PawPrint, name: 'Pet Shops' },
  { icon: Pill, name: 'Farmácias e Drogarias' },
  { icon: ShoppingCart, name: 'Mercados e Conveniências' },
  { icon: Flower, name: 'Floriculturas' },
];

const comparison = [
  { feature: 'Taxa por pedido', pedy: 'R$ 0,00', others: '12% a 27%' },
  { feature: 'Mensalidade', pedy: 'Planos acessíveis', others: 'R$ 100+' },
  { feature: 'Pedidos ilimitados', pedy: true, others: false },
  { feature: 'Contato direto com cliente', pedy: true, others: false },
  { feature: 'Cardápio personalizado', pedy: true, others: false },
  { feature: 'Tempo para começar', pedy: '5 minutos', others: 'Dias/Semanas' },
];

const faqs = [
  {
    question: 'Preciso ter conta em alguma plataforma?',
    answer: 'Não! O PEDY funciona de forma independente. Você só precisa de um número de WhatsApp.',
  },
  {
    question: 'Preciso ter CNPJ para me cadastrar?',
    answer: 'Não! Você pode se cadastrar usando apenas o seu CPF. O PEDY é para todos: MEIs, autônomos e empresas de qualquer porte.',
  },
  {
    question: 'Quanto tempo leva para configurar meu cardápio?',
    answer: 'Em média 5 minutos. É só cadastrar suas categorias, produtos e pronto!',
  },
  {
    question: 'Posso usar mesmo sem saber de tecnologia?',
    answer: 'Sim! O PEDY foi feito para ser simples. Se você sabe usar WhatsApp, sabe usar o PEDY.',
  },
  {
    question: 'O que acontece após os 7 dias de teste?',
    answer: 'Você escolhe o plano ideal para seu negócio ou seu cardápio será pausado até a ativação.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim, sem multa e sem burocracia. Basta entrar em contato pelo WhatsApp.',
  },
  {
    question: 'Os pedidos vão direto pro meu WhatsApp?',
    answer: 'Exatamente! O cliente monta o pedido no cardápio e envia formatado pro seu número.',
  },
  {
    question: 'Funciona com Pix?',
    answer: 'Sim! Você pode configurar sua chave Pix no painel e o cliente recebe as instruções de pagamento no momento do pedido.',
  },
  {
    question: 'Preciso ter WhatsApp Business?',
    answer: 'Não é obrigatório, mas recomendamos. O PEDY funciona com WhatsApp normal ou Business.',
  },
  {
    question: 'Posso usar mais de um número de WhatsApp?',
    answer: 'Cada estabelecimento cadastrado possui um número de WhatsApp vinculado. Se você tem mais de um negócio, pode criar contas separadas.',
  },
];

const templateCards = [
  { id: 'pizzaria', icon: '🍕', name: 'Pizzaria' },
  { id: 'hamburgueria', icon: '🍔', name: 'Hamburgueria' },
  { id: 'marmitaria', icon: '🍱', name: 'Marmitaria' },
  { id: 'acaiteria', icon: '🫐', name: 'Açaiteria' },
  { id: 'pastelaria', icon: '🥟', name: 'Pastelaria' },
  { id: 'japonesa', icon: '🍣', name: 'Japonesa' },
  { id: 'petshop', icon: '🐾', name: 'Pet Shop' },
  { id: 'loja_racao', icon: '🦴', name: 'Ração' },
  { id: 'farmacia', icon: '💊', name: 'Farmácia' },
  { id: 'deposito_bebidas', icon: '🍺', name: 'Bebidas' },
  { id: 'sorveteria', icon: '🍦', name: 'Sorveteria' },
  { id: 'padaria', icon: '🥐', name: 'Padaria' },
  { id: 'hortifruti', icon: '🥬', name: 'Hortifrúti' },
];

// Floating background icons for thematic decoration
const FloatingIcons = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Decorative blurred circles */}
    <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
    <div className="absolute top-1/3 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
  </div>
);

interface ResellerRefInfo {
  id: string;
  name: string;
  pricing_mode: string;
  whatsapp: string | null;
}

// PWA Entry Screen - Clean app entry without marketing content
function PWAEntryScreen() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center text-center max-w-sm">
        {/* Logo */}
        <img 
          src={pedyLogo} 
          alt="PEDY" 
          className="h-32 md:h-40 object-contain mb-8" 
        />
        
        {/* Welcome text */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Bem-vindo ao Pedy
        </h1>
        <p className="text-muted-foreground mb-8">
          Cardápio digital que vende mais
        </p>
        
        {/* Login button */}
        <Button 
          size="lg" 
          className="w-full max-w-xs"
          onClick={() => navigate('/login')}
        >
          <LogIn className="w-5 h-5 mr-2" />
          Entrar na minha conta
        </Button>
        
        {/* Create account link */}
        <p className="text-sm text-muted-foreground mt-6">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="text-primary font-medium hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [reseller, setReseller] = useState<ResellerRefInfo | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [pwaCheckComplete, setPwaCheckComplete] = useState(false);

  // Check PWA mode and handle redirects
  useEffect(() => {
    const checkPWAAndRedirect = async () => {
      const isStandalone = isPWAMode();
      setIsPWA(isStandalone);
      
      if (isStandalone) {
        // Priority 1: Check for active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/dashboard', { replace: true });
          return;
        }
        
        // Priority 2: Check for last visited menu
        const lastMenu = localStorage.getItem('pwa-start-url') || 
                         localStorage.getItem('last_visited_menu');
        if (lastMenu && lastMenu !== '/') {
          navigate(lastMenu, { replace: true });
          return;
        }
        
        // Priority 3: Show PWA entry screen (handled by render)
      }
      
      setPwaCheckComplete(true);
    };
    
    checkPWAAndRedirect();
  }, [navigate]);

  // Fetch reseller info from referral code
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      fetchResellerInfo(refCode);
    }
  }, [searchParams]);

  const fetchResellerInfo = async (code: string) => {
    try {
      // Get reseller by code
      const { data: resellerData } = await supabase.rpc('get_reseller_by_code', { code });
      
      if (resellerData && resellerData.length > 0) {
        // Fetch full reseller data including whatsapp
        const { data: fullReseller } = await supabase
          .from('resellers')
          .select('id, name, pricing_mode, whatsapp')
          .eq('id', resellerData[0].id)
          .single();
        
        if (fullReseller) {
          setReseller(fullReseller);
        }
      }
    } catch (error) {
      console.error('Error fetching reseller:', error);
    }
  };

  // Carousel slide tracking
  useEffect(() => {
    if (!carouselApi) return;

    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap());

    carouselApi.on('select', () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  // Get the correct registration link (preserving ref code)
  const getRegistrationLink = () => {
    const refCode = searchParams.get('ref');
    return refCode ? `/cadastro?ref=${refCode}` : '/cadastro';
  };

  // Handle CTA click - different behavior based on reseller mode
  const handleCTAClick = () => {
    // If reseller with custom_price mode and has whatsapp, redirect to their WhatsApp
    if (reseller && reseller.pricing_mode === 'custom_price' && reseller.whatsapp) {
      const cleanPhone = reseller.whatsapp.replace(/\D/g, '');
      const message = encodeURIComponent('Olá! Vi o PEDY e quero saber mais sobre o cardápio digital para meu negócio.');
      window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
      return;
    }
    
    // Otherwise, redirect to support WhatsApp
    const message = encodeURIComponent('Olá! Quero saber mais sobre o PEDY.');
    window.open(`https://wa.me/55${SUPPORT_WHATSAPP}?text=${message}`, '_blank');
  };

  // Show loading while checking PWA status
  if (!pwaCheckComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <img src={pedyLogo} alt="PEDY" className="h-24 animate-pulse" />
      </div>
    );
  }

  // If PWA mode, show clean entry screen (without marketing)
  if (isPWA) {
    return <PWAEntryScreen />;
  }

  // Normal browser mode - show full landing page
  
  return (
    <div className="min-h-screen animated-gradient-bg relative">
      {/* Floating thematic icons */}
      <FloatingIcons />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <img src={pedyLogo} alt="PEDY" className="h-20 md:h-24 object-contain" />
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-foreground">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm">Criar conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4 relative">
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6 border border-secondary/30">
                <Zap className="w-4 h-4" />
                <span className="font-bold">Sem taxas por pedido · Sem comissão</span>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={100}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Venda mais pelo WhatsApp{' '}
                <span className="text-primary font-extrabold">
                  <AnimatedText 
                    words={['sem pagar taxa', 'sem comissão', 'sem burocracia', 'com mais lucro']}
                    className="text-primary"
                  />
                </span>
              </h1>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Chega de áudios confusos e pedidos bagunçados. Com o PEDY, seu cliente monta o pedido sozinho 
                e você recebe tudo organizado no WhatsApp. <span className="text-primary font-semibold">Pronto em 5 minutos.</span>
              </p>
            </ScrollReveal>
            
            <ScrollReveal delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link to={getRegistrationLink()}>
                  <Button variant="hero" size="xl" className="w-full sm:w-auto group">
                    Criar cardápio grátis agora
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    <Smartphone className="w-5 h-5 mr-1" />
                    Ver demonstração
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={400}>
              <p className="text-sm text-muted-foreground">
                <span className="text-secondary font-semibold">✓ 7 dias grátis</span> • 
                <span className="text-secondary font-semibold"> ✓ Sem cartão de crédito</span> • 
                <span className="text-secondary font-semibold"> ✓ Cancele quando quiser</span>
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {[
                  'Sem taxa por pedido',
                  'Planos acessíveis', 
                  'Templates prontos por nicho',
                ].map((badge, index) => (
                  <span 
                    key={index}
                    className="bg-primary/15 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20"
                  >
                    ✓ {badge}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card/80 backdrop-blur-sm border-y border-border relative z-10">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <ScrollReveal 
                key={index}
                delay={index * 100}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                    <span className="text-3xl md:text-4xl font-bold text-primary">
                      <AnimatedCounter 
                        value={stat.value} 
                        prefix={stat.prefix || ''} 
                        suffix={stat.suffix}
                        decimals={stat.decimals ?? 0}
                      />
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - Movido para antes de Features */}
      <section className="py-16 relative z-10">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Como funciona?
              </h2>
              <p className="text-muted-foreground text-lg">
                Em <span className="text-primary font-bold">3 passos simples</span> você começa a receber pedidos
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Crie sua conta', desc: 'Cadastre seu estabelecimento em menos de 2 minutos' },
              { step: '2', title: 'Monte seu cardápio', desc: 'Adicione seus produtos com fotos, preços e adicionais' },
              { step: '3', title: 'Receba pedidos', desc: 'Compartilhe o link e receba pedidos no WhatsApp' },
            ].map((item, index) => (
              <ScrollReveal key={index} delay={index * 150}>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground group-hover:scale-110 transition-transform shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card/80 backdrop-blur-sm relative z-10">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Tudo que você precisa para <span className="text-secondary font-extrabold">vender mais</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Acabe com a confusão no WhatsApp, reduza erros nos pedidos e ganhe tempo para focar no que importa: seu negócio
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="bg-background rounded-2xl p-6 shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border group h-full">
                  <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Segments Section - Para Quem é o PEDY */}
      <section className="py-16 relative z-10">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-4 py-2 rounded-full text-sm font-bold mb-4 border border-primary/20">
                <Users className="w-4 h-4" />
                Para todos os segmentos
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Para quem é o PEDY?
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Não importa se você vende comida, produtos ou serviços. Se você recebe pedidos por WhatsApp, <span className="text-primary font-semibold">o PEDY foi feito para você.</span>
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {segments.map((segment, index) => (
              <ScrollReveal key={index} delay={index * 50}>
                <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4 text-center shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border group">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <segment.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{segment.name}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-16 bg-card/80 backdrop-blur-sm relative z-10">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-bold mb-4 border border-secondary/30">
                <Zap className="w-4 h-4" />
                Novidades
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Recursos avançados para <span className="text-primary font-extrabold">vender mais</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Funcionalidades que grandes plataformas cobram caro, <span className="text-secondary font-semibold">aqui estão incluídas no seu plano</span>
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="bg-background rounded-2xl p-6 shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-border group h-full">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 relative z-10 overflow-hidden">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-4 py-2 rounded-full text-sm font-bold mb-4 border border-primary/20">
                <Quote className="w-4 h-4" />
                Depoimentos
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                O que nossos clientes dizem
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Veja como o PEDY está transformando o delivery de estabelecimentos por todo o Brasil
              </p>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <div className="max-w-5xl mx-auto">
              <Carousel
                setApi={setCarouselApi}
                opts={{
                  align: 'start',
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 4000,
                    stopOnInteraction: true,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {testimonials.map((testimonial, index) => (
                    <CarouselItem key={index} className="pl-4 md:basis-1/2">
                      <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-6 shadow-soft border border-border hover:shadow-xl transition-all duration-300 h-full group relative">
                        {/* Quote icon decorative - large */}
                        <div className="text-primary/20 text-5xl font-serif leading-none mb-2 group-hover:text-primary/30 transition-colors">
                          ❝
                        </div>
                        
                        {/* Testimonial text */}
                        <p className="text-foreground mb-4 italic leading-relaxed">
                          "{testimonial.text}"
                        </p>
                        
                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        
                        {/* Author info - text only */}
                        <div className="border-t border-border pt-4">
                          <p className="font-bold text-foreground">{testimonial.name}</p>
                          <p className="text-sm text-primary font-medium">{testimonial.business}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.city}</p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {/* Navigation dots */}
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: slideCount }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => carouselApi?.scrollTo(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      currentSlide === index 
                        ? 'bg-primary w-8' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                    aria-label={`Ir para depoimento ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>
          
          {/* CTA Intermediário após Depoimentos */}
          <ScrollReveal delay={400}>
            <div className="text-center mt-12 pt-8 border-t border-border">
              <p className="text-lg text-foreground mb-4 font-medium">
                Pronto para transformar seu delivery como eles?
              </p>
              <Link to="/cadastro">
                <Button variant="hero" size="lg" className="group">
                  Quero criar meu cardápio grátis
                  <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-3">
                Comece agora, teste por 7 dias sem compromisso
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 bg-card/80 backdrop-blur-sm relative z-10">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-destructive/15 text-destructive px-4 py-2 rounded-full text-sm font-bold mb-4 border border-destructive/20">
                <TrendingUp className="w-4 h-4" />
                Compare e economize
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                PEDY vs Plataformas tradicionais
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Por que pagar até <span className="text-destructive font-bold">27% de comissão</span> por pedido quando você pode ter seu próprio cardápio digital por um valor fixo mensal?
              </p>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <div className="max-w-3xl mx-auto">
              <div className="bg-background rounded-2xl shadow-soft border border-border overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-3 bg-muted/50 p-4 border-b border-border">
                  <div className="font-semibold text-foreground">Funcionalidade</div>
                  <div className="font-semibold text-center text-primary">PEDY</div>
                  <div className="font-semibold text-center text-muted-foreground">Plataformas tradicionais</div>
                </div>
                
                {/* Table Body with staggered animations */}
                {comparison.map((item, index) => (
                  <div 
                    key={index}
                    className={`grid grid-cols-3 p-4 items-center transition-all duration-500 hover:bg-secondary/5 group ${index !== comparison.length - 1 ? 'border-b border-border' : ''}`}
                    style={{
                      animation: `fade-in 0.4s ease-out ${300 + index * 100}ms both`
                    }}
                  >
                    <div className="text-foreground text-sm md:text-base group-hover:font-medium transition-all">{item.feature}</div>
                    <div className="text-center relative">
                      {typeof item.pedy === 'boolean' ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary/15 group-hover:bg-secondary/25 transition-all group-hover:scale-110">
                          <Check className="w-5 h-5 text-secondary" />
                        </div>
                      ) : (
                        <span className="font-bold text-secondary group-hover:scale-105 inline-block transition-transform">{item.pedy}</span>
                      )}
                    </div>
                    <div className="text-center">
                      {typeof item.others === 'boolean' ? (
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 group-hover:bg-destructive/15 transition-all">
                          <X className="w-5 h-5 text-destructive" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground line-through decoration-destructive/50">{item.others}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Highlight savings badge */}
              <div className="flex justify-center mt-6">
                <div 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-secondary/20 to-primary/20 text-foreground px-6 py-3 rounded-full text-sm font-bold border border-secondary/30 shadow-lg"
                  style={{ animation: 'fade-in 0.5s ease-out 1s both' }}
                >
                  <span className="text-secondary">💰</span>
                  Economize até R$ 3.000/mês em taxas
                  <span className="text-primary">🚀</span>
                </div>
              </div>
              
              <p className="text-center text-sm text-muted-foreground mt-4">
                * Comparação baseada em valores médios praticados por grandes plataformas de delivery do mercado
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>


      {/* Templates de Nicho */}
      <section className="py-16 relative z-10">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-secondary/20 text-secondary hover:bg-secondary/30 font-bold border border-secondary/30">
                Templates Prontos
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Templates prontos para seu negócio
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Clique em um nicho para ver o cardápio de exemplo. 
                <span className="text-primary font-semibold"> Personalize como quiser!</span>
              </p>
            </div>
          </ScrollReveal>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4 max-w-4xl mx-auto">
            {templateCards.map((template, index) => (
              <ScrollReveal key={template.id} delay={index * 30}>
                <div 
                  onClick={() => setSelectedTemplate(template.id)}
                  className="group bg-card/90 backdrop-blur-sm rounded-xl p-4 text-center border border-border 
                             hover:border-primary hover:shadow-xl hover:scale-105 
                             active:scale-95 cursor-pointer
                             transition-all duration-300 ease-out"
                >
                  <span className="text-3xl md:text-4xl mb-2 block transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300">
                    {template.icon}
                  </span>
                  <span className="text-xs md:text-sm font-medium text-foreground">{template.name}</span>
                  <span className="text-[10px] text-primary mt-1 block opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    Ver prévia
                  </span>
                </div>
              </ScrollReveal>
            ))}
          </div>
          
          <ScrollReveal delay={400}>
            <p className="text-center text-muted-foreground mt-6 text-sm">
              E se seu nicho não estiver na lista, <span className="text-primary font-semibold">você pode criar do zero!</span>
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Modal de Prévia do Template */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {selectedTemplate && NICHE_TEMPLATES[selectedTemplate] && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-4xl">{NICHE_TEMPLATES[selectedTemplate].icon}</span>
                  <div>
                    <span className="text-xl block">{NICHE_TEMPLATES[selectedTemplate].name}</span>
                    <p className="text-sm text-muted-foreground font-normal">
                      {NICHE_TEMPLATES[selectedTemplate].description}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {NICHE_TEMPLATES[selectedTemplate].categories?.map((category, catIndex) => (
                  <div key={catIndex}>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-primary" />
                      {category.name}
                    </h4>
                    <div className="space-y-2 pl-6">
                      {category.products.slice(0, 3).map((product, prodIndex) => (
                        <div key={prodIndex} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{product.name}</span>
                          <span className="text-foreground font-medium">
                            R$ {product.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                      {category.products.length > 3 && (
                        <p className="text-xs text-muted-foreground italic">
                          +{category.products.length - 3} mais produtos...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {!NICHE_TEMPLATES[selectedTemplate].categories?.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Este template inclui grupos de personalização prontos para usar!
                  </p>
                )}
              </div>
              
              <Link to="/cadastro" className="mt-6 block">
                <Button variant="hero" className="w-full group">
                  Usar este template e começar grátis
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Por que escolher o PEDY */}
      <section className="py-16 bg-card/80 backdrop-blur-sm relative z-10">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Por que escolher o <span className="text-primary font-extrabold">PEDY</span>?
                </h2>
                <p className="text-muted-foreground text-lg">
                  Tudo que você precisa para vender mais, <span className="text-secondary font-semibold">sem complicação</span>
                </p>
              </div>
            </ScrollReveal>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: '💰', text: 'Sem taxa por pedido' },
                { icon: '📱', text: 'Planos acessíveis' },
                { icon: '🎁', text: '7 dias grátis' },
                { icon: '💳', text: 'Sem cartão no teste' },
                { icon: '❌', text: 'Cancele quando quiser' },
                { icon: '📋', text: 'Templates prontos por nicho' },
              ].map((item, index) => (
                <ScrollReveal key={index} delay={index * 50}>
                  <div className="bg-background rounded-xl p-4 text-center border border-border shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <span className="text-2xl mb-2 block group-hover:scale-125 transition-transform">{item.icon}</span>
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>
            
            <ScrollReveal delay={300}>
              <div className="text-center">
                <Link to="/cadastro">
                  <Button variant="hero" size="xl" className="group">
                    Criar meu cardápio grátis agora
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16 relative z-10">
        <div className="container">
          <ScrollReveal>
            <div className="max-w-2xl mx-auto">
              <div className="bg-card/90 backdrop-blur-sm rounded-3xl p-8 md:p-10 text-center shadow-xl border-2 border-secondary/40 hover:border-secondary/60 transition-colors">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Shield className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Teste sem risco por <span className="text-secondary">7 dias</span>
                </h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Se você não gostar, <span className="text-primary font-semibold">não paga nada</span>. Sem cartão de crédito, sem compromisso. 
                  Você só precisa de 5 minutos para criar seu cardápio e começar a receber pedidos.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    <span className="font-medium">Sem cartão de crédito</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    <span className="font-medium">Sem compromisso</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    <span className="font-medium">Cancele quando quiser</span>
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-card/80 backdrop-blur-sm relative z-10">
        <div className="container">
          <ScrollReveal>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/15 text-primary px-4 py-2 rounded-full text-sm font-bold mb-4 border border-primary/20">
                <HelpCircle className="w-4 h-4" />
                Dúvidas frequentes
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Perguntas frequentes
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Tire suas dúvidas sobre o PEDY
              </p>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={200}>
            <div className="max-w-2xl mx-auto">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="bg-background rounded-xl border border-border px-6 data-[state=open]:shadow-lg data-[state=open]:border-primary/30 transition-all"
                  >
                    <AccordionTrigger className="text-left text-foreground hover:no-underline py-4 hover:text-primary transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 relative z-10">
        <div className="container">
          <ScrollReveal>
            <div className="bg-gradient-hero rounded-3xl p-8 md:p-12 text-center shadow-2xl">
              <div className="max-w-2xl mx-auto">
                <Users className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                  Junte-se a centenas de estabelecimentos
                </h2>
                <p className="text-primary-foreground/90 text-lg mb-6">
                  Enquanto você lê isso, outros estabelecimentos já estão recebendo pedidos organizados pelo PEDY. 
                  <span className="font-bold"> Crie seu cardápio agora e veja a diferença.</span>
                </p>
                <Link to="/cadastro">
                  <Button 
                    size="xl" 
                    className="bg-card text-foreground hover:bg-card/90 shadow-xl group"
                  >
                    Começar grátis em 5 minutos
                    <ArrowRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card/80 backdrop-blur-sm relative z-10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src={pedyLogo} alt="PEDY" className="h-20 md:h-24 object-contain" />
            <p className="text-sm text-muted-foreground">
              © 2026 PEDY. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                Entrar
              </Link>
              <Link to="/cadastro" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
