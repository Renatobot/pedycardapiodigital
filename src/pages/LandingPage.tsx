import pedyLogo from '@/assets/logo_pedy.png';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
    description: 'Receba os pedidos organizados diretamente no WhatsApp do seu negócio.',
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
  { value: 'R$ 0', label: 'Taxa por pedido' },
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
  { feature: 'Mensalidade', pedy: 'R$ 37,00', others: 'R$ 100+' },
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
    answer: 'Você pode escolher assinar o plano PRO por R$ 37/mês ou seu cardápio será pausado.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer: 'Sim, sem multa e sem burocracia. Basta entrar em contato pelo WhatsApp.',
  },
  {
    question: 'Os pedidos vão direto pro meu WhatsApp?',
    answer: 'Exatamente! O cliente monta o pedido no cardápio e envia formatado pro seu número.',
  },
];

export default function LandingPage() {
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
              Comece a vender mais hoje!
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Seu cardápio digital com{' '}
              <span className="text-gradient">pedidos no WhatsApp</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Crie seu cardápio online em minutos. Seus clientes escolhem os produtos 
              e enviam o pedido completo direto para o seu WhatsApp. Simples assim!
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/cadastro">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Começar grátis
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

      {/* Features Section */}
      <section className="py-16">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para vender mais
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ferramentas simples e poderosas para transformar seu delivery
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up border border-border"
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
      <section className="py-16 bg-card">
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
              Ideal para qualquer negócio que faz entregas ou precisa de um cardápio digital
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {segments.map((segment, index) => (
              <div 
                key={index}
                className="bg-background rounded-xl p-4 text-center shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up border border-border"
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

      {/* How it works */}
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
              Veja por que centenas de estabelecimentos estão migrando para o PEDY
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

      {/* FAQ Section */}
      <section className="py-16">
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
                  className="bg-card rounded-xl border border-border px-6 data-[state=open]:shadow-soft"
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

      {/* Pricing */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="max-w-md mx-auto">
            <div className="bg-background rounded-3xl shadow-xl overflow-hidden border border-border">
              <div className="bg-gradient-hero p-6 text-center">
                <h3 className="text-2xl font-bold text-primary-foreground mb-1">Plano Pro</h3>
                <p className="text-primary-foreground/80 text-sm">Tudo liberado, sem limites</p>
              </div>
              
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-5xl font-bold text-foreground">37</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Comece com 7 dias grátis!
                  </p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
                
                <Link to="/cadastro" className="block">
                  <Button variant="hero" size="lg" className="w-full">
                    Começar teste grátis
                  </Button>
                </Link>
              </div>
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
                Restaurantes, lanchonetes, açaiterias, padarias e muito mais já usam o PEDY 
                para receber pedidos de forma organizada.
              </p>
              <Link to="/cadastro">
                <Button 
                  size="xl" 
                  className="bg-card text-foreground hover:bg-card/90 shadow-xl"
                >
                  Criar minha conta grátis
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
