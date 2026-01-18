import pedyLogo from '@/assets/logo_pedy.jpg';
import { Button } from '@/components/ui/button';
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
  Users
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

const benefits = [
  'Teste grátis por 7 dias',
  'Sem taxa por pedido',
  'Suporte via WhatsApp',
  'Atualizações gratuitas',
  'Funciona no celular',
  'Fácil de usar',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <img src={pedyLogo} alt="PEDY" className="h-14 md:h-16 object-contain" />
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

      {/* Features Section */}
      <section className="py-16 bg-card">
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
                className="bg-background rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
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

      {/* CTA Section */}
      <section className="py-16">
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
            <img src={pedyLogo} alt="PEDY" className="h-14 md:h-16 object-contain" />
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
