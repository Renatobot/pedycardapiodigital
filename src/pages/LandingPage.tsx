import { useState } from 'react';
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
  ShoppingBag, 
  Smartphone, 
  MessageCircle, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Store,
  Menu as MenuIcon,
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
  Folder
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { NICHE_TEMPLATES } from '@/lib/nicheTemplates';

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
];

const stats = [
  { value: '500+', label: 'Estabelecimentos ativos' },
  { value: '50.000+', label: 'Pedidos enviados' },
  { value: 'R$ 0', label: 'Taxa por pedido · Sem comissão, sem surpresas' },
  { value: '5 min', label: 'Para criar seu cardápio' },
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

export default function LandingPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <img src={pedyLogo} alt="PEDY" className="h-20 md:h-24 object-contain" />
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button size="sm">Criar conta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Sem taxas por pedido · Sem comissão
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Venda mais pelo WhatsApp{' '}
              <span className="text-gradient">sem pagar taxa por pedido</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Chega de áudios confusos e pedidos bagunçados. Com o PEDY, seu cliente monta o pedido sozinho 
              e você recebe tudo organizado no WhatsApp. Pronto em 5 minutos.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/cadastro">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Criar cardápio grátis agora
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  <Smartphone className="w-5 h-5 mr-1" />
                  Ver demonstração
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground">
              ✓ 7 dias grátis • ✓ Sem cartão de crédito • ✓ Cancele quando quiser
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {[
                'Sem taxa por pedido',
                'Planos acessíveis', 
                'Templates prontos por nicho',
              ].map((badge, index) => (
                <span 
                  key={index}
                  className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-medium"
                >
                  ✓ {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - Movido para antes de Features */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como funciona?
            </h2>
            <p className="text-muted-foreground text-lg">
              Em 3 passos simples você começa a receber pedidos
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Crie sua conta', desc: 'Cadastre seu estabelecimento em menos de 2 minutos' },
              { step: '2', title: 'Monte seu cardápio', desc: 'Adicione seus produtos com fotos, preços e adicionais' },
              { step: '3', title: 'Receba pedidos', desc: 'Compartilhe o link e receba pedidos no WhatsApp' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para vender mais
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Acabe com a confusão no WhatsApp, reduza erros nos pedidos e ganhe tempo para focar no que importa: seu negócio
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-background rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up border border-border"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Segments Section - Para Quem é o PEDY */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              Para todos os segmentos
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Para quem é o PEDY?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Não importa se você vende comida, produtos ou serviços. Se você recebe pedidos por WhatsApp, o PEDY foi feito para você.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {segments.map((segment, index) => (
              <div 
                key={index}
                className="bg-card rounded-xl p-4 text-center shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up border border-border"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <segment.icon className="w-6 h-6 text-secondary" />
                </div>
                <p className="text-sm font-medium text-foreground">{segment.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Novidades
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Recursos avançados para vender mais
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Funcionalidades que grandes plataformas cobram caro, aqui estão incluídas no seu plano
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-background rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up border border-border"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-6 shadow-soft border border-border animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-primary">{testimonial.business}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.city}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA Intermediário após Depoimentos */}
          <div className="text-center mt-12 pt-8 border-t border-border">
            <p className="text-lg text-foreground mb-4 font-medium">
              Pronto para transformar seu delivery como eles?
            </p>
            <Link to="/cadastro">
              <Button variant="hero" size="lg">
                Quero criar meu cardápio grátis
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3">
              Comece agora, teste por 7 dias sem compromisso
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full text-sm font-medium mb-4">
              <TrendingUp className="w-4 h-4" />
              Compare e economize
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              PEDY vs Plataformas tradicionais
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Por que pagar até 27% de comissão por pedido quando você pode ter seu próprio cardápio digital por um valor fixo mensal?
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-background rounded-2xl shadow-soft border border-border overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-3 bg-muted/50 p-4 border-b border-border">
                <div className="font-semibold text-foreground">Funcionalidade</div>
                <div className="font-semibold text-center text-primary">PEDY</div>
                <div className="font-semibold text-center text-muted-foreground">Plataformas tradicionais</div>
              </div>
              
              {/* Table Body */}
              {comparison.map((item, index) => (
                <div 
                  key={index}
                  className={`grid grid-cols-3 p-4 items-center ${index !== comparison.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="text-foreground text-sm md:text-base">{item.feature}</div>
                  <div className="text-center">
                    {typeof item.pedy === 'boolean' ? (
                      <Check className="w-6 h-6 text-secondary mx-auto" />
                    ) : (
                      <span className="font-semibold text-secondary">{item.pedy}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {typeof item.others === 'boolean' ? (
                      <X className="w-6 h-6 text-destructive mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">{item.others}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center text-sm text-muted-foreground mt-4">
              * Comparação baseada em valores médios praticados por grandes plataformas de delivery do mercado
            </p>
          </div>
        </div>
      </section>


      {/* Templates de Nicho */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-secondary/10 text-secondary hover:bg-secondary/20">
              Templates Prontos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Templates prontos para seu negócio
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Clique em um nicho para ver o cardápio de exemplo. 
              Personalize como quiser!
            </p>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 md:gap-4 max-w-4xl mx-auto">
            {templateCards.map((template, index) => (
              <div 
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className="group bg-card rounded-xl p-4 text-center border border-border 
                           hover:border-primary hover:shadow-lg hover:scale-105 
                           active:scale-95 cursor-pointer
                           transition-all duration-300 ease-out
                           animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-3xl md:text-4xl mb-2 block transform group-hover:scale-110 transition-transform duration-200">
                  {template.icon}
                </span>
                <span className="text-xs md:text-sm font-medium text-foreground">{template.name}</span>
                <span className="text-[10px] text-primary mt-1 block opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver prévia
                </span>
              </div>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground mt-6 text-sm">
            E se seu nicho não estiver na lista, você pode criar do zero!
          </p>
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
                <Button variant="hero" className="w-full">
                  Usar este template e começar grátis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Por que escolher o PEDY */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Por que escolher o PEDY?
              </h2>
              <p className="text-muted-foreground text-lg">
                Tudo que você precisa para vender mais, sem complicação
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: '💰', text: 'Sem taxa por pedido' },
                { icon: '📱', text: 'Planos acessíveis' },
                { icon: '🎁', text: '7 dias grátis' },
                { icon: '💳', text: 'Sem cartão no teste' },
                { icon: '❌', text: 'Cancele quando quiser' },
                { icon: '📋', text: 'Templates prontos por nicho' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="bg-background rounded-xl p-4 text-center border border-border shadow-soft hover:shadow-lg transition-all duration-300"
                >
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <span className="text-sm font-medium text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Link to="/cadastro">
                <Button variant="hero" size="xl">
                  Criar meu cardápio grátis agora
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Section */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-3xl p-8 md:p-10 text-center shadow-soft border-2 border-secondary/30">
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Teste sem risco por 7 dias
              </h3>
              <p className="text-muted-foreground text-lg mb-6">
                Se você não gostar, não paga nada. Sem cartão de crédito, sem compromisso. 
                Você só precisa de 5 minutos para criar seu cardápio e começar a receber pedidos.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Sem cartão de crédito
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Sem compromisso
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Cancele quando quiser
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
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
          
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-background rounded-xl border border-border px-6 data-[state=open]:shadow-soft"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="bg-gradient-hero rounded-3xl p-8 md:p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <Users className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Junte-se a centenas de estabelecimentos
              </h2>
              <p className="text-primary-foreground/90 text-lg mb-6">
                Enquanto você lê isso, outros estabelecimentos já estão recebendo pedidos organizados pelo PEDY. 
                Crie seu cardápio agora e veja a diferença.
              </p>
              <Link to="/cadastro">
                <Button 
                  size="xl" 
                  className="bg-card text-foreground hover:bg-card/90 shadow-xl"
                >
                  Começar grátis em 5 minutos
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src={pedyLogo} alt="PEDY" className="h-20 md:h-24 object-contain" />
            <p className="text-sm text-muted-foreground">
              © 2026 PEDY. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Entrar
              </Link>
              <Link to="/cadastro" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cadastrar
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
