import { Link } from 'react-router-dom';
import pedyLogo from '@/assets/logo_pedy.jpg';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, CheckCircle2, XCircle, MessageCircle, ArrowLeft, Smartphone, Sparkles, Lightbulb, Gift, Users, Wallet } from 'lucide-react';
import { openWhatsApp, SUPPORT_WHATSAPP } from '@/lib/whatsapp';
import { Badge } from '@/components/ui/badge';
import { AnimatedText } from '@/components/AnimatedText';
import { ScrollReveal } from '@/components/ScrollReveal';
import { AnimatedCounter } from '@/components/AnimatedCounter';
// Recursos base disponíveis em TODOS os planos
const baseFeatures = [
  'Cardápio digital ilimitado',
  'Pedidos via WhatsApp',
  'Instalar como App (PWA)',
  'Central de Pagamentos',
  'Templates de resposta WhatsApp',
  'Sem taxa por pedido',
];

// Recursos exclusivos do Pro
const proFeatures = [
  'Painel de pedidos em tempo real',
  'Notificações Push',
  'Cupons de desconto',
  'Taxas por bairro',
  'Métricas básicas (faturamento, ticket médio)',
  'Agendamento com loja aberta',
  'Busca e filtro de pedidos',
  'Impressão de pedidos',
  'Pizzas até 2 sabores (preço manual)',
];

// Recursos exclusivos do Pro+
const proPlusFeatures = [
  'Pizzas 2 ou mais sabores',
  'Precificação automática (cobra pelo mais caro)',
  'Dashboard analítico avançado',
  'CRM - Gestão de clientes',
  'Promoções automáticas',
  'Exportação de dados',
  'Duplicar produto',
];

interface Plan {
  name: string;
  price: number;
  icon: React.ElementType;
  highlighted: boolean;
  badge?: string;
  included: string[];
  excluded: string[];
  message: string;
  colorClass: string;
  headerClass: string;
}

const plans: Plan[] = [
  {
    name: 'BÁSICO',
    price: 37,
    icon: Smartphone,
    highlighted: false,
    included: baseFeatures,
    excluded: [...proFeatures, ...proPlusFeatures],
    message: 'Olá! Quero ativar o Plano Básico (R$ 37/mês).',
    colorClass: 'text-blue-600',
    headerClass: 'bg-muted',
  },
  {
    name: 'PRO',
    price: 59.90,
    icon: Crown,
    highlighted: true,
    badge: 'MAIS POPULAR',
    included: [...baseFeatures, ...proFeatures],
    excluded: proPlusFeatures,
    message: 'Olá! Quero ativar o Plano Pro (R$ 59,90/mês).',
    colorClass: 'text-primary',
    headerClass: 'bg-gradient-hero',
  },
  {
    name: 'PRO+',
    price: 79.90,
    icon: Sparkles,
    highlighted: false,
    included: [...baseFeatures, ...proFeatures, ...proPlusFeatures],
    excluded: [],
    message: 'Olá! Quero ativar o Plano Pro+ (R$ 79,90/mês).',
    colorClass: 'text-amber-600',
    headerClass: 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20',
  },
];

interface PlanCardProps {
  plan: Plan;
  index: number;
}

const PlanCard = ({ plan, index }: PlanCardProps) => {
  const Icon = plan.icon;
  
  return (
    <ScrollReveal delay={index * 150}>
      <Card className={`shadow-soft overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group ${
        plan.highlighted 
          ? 'ring-2 ring-primary/50 border-primary/30 scale-[1.02] animate-pulse-ring' 
          : 'border-muted hover:border-primary/20'
      }`}>
        <div className={`p-4 text-center ${plan.headerClass} ${plan.highlighted ? 'text-primary-foreground' : ''}`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
              plan.highlighted ? 'text-primary-foreground group-hover:animate-wiggle' : plan.colorClass
            }`} />
            <span className={`font-bold ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
              {plan.name}
            </span>
            {plan.badge && (
              <Badge className="bg-primary-foreground/20 text-primary-foreground text-[10px] px-1.5 animate-bounce-subtle">
                {plan.badge}
              </Badge>
            )}
          </div>
          <div className={`flex items-baseline justify-center gap-1 ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
            <span className="text-sm">R$</span>
            <span className="text-4xl font-bold">
              <AnimatedCounter value={plan.price} decimals={2} duration={1200} />
            </span>
            <span className={plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}>/mês</span>
          </div>
        </div>
        
        <CardContent className="pt-4">
          {/* Recursos incluídos */}
          <ul className="space-y-2 mb-3">
            {plan.included.map((feature, featureIndex) => (
              <li 
                key={featureIndex} 
                className="flex items-center gap-2 text-sm text-foreground"
                style={{ 
                  animationDelay: `${featureIndex * 50}ms`,
                }}
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          
          {/* Recursos NÃO incluídos */}
          {plan.excluded.length > 0 && (
            <ul className="space-y-2 mb-4">
              {plan.excluded.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground/70">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="line-through">{feature}</span>
                </li>
              ))}
            </ul>
          )}
          
          <Button 
            variant={plan.highlighted ? "whatsapp" : "outline"}
            size="lg"
            className="w-full relative overflow-hidden group/btn"
            onClick={() => openWhatsApp(SUPPORT_WHATSAPP, plan.message)}
          >
            <span className="relative z-10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 mr-2 transition-transform group-hover/btn:scale-110" />
              Ativar {plan.name}
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover/btn:translate-x-[200%] transition-transform duration-700" />
          </Button>
        </CardContent>
      </Card>
    </ScrollReveal>
  );
};

export default function UpgradePage() {
  const dynamicWords = ['profissional', 'organizado', 'lucrativo', 'moderno'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </header>

      <div className="flex-1 flex items-start justify-center p-4 pb-8">
        <div className="w-full max-w-md space-y-4">
          <ScrollReveal>
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-foreground">
                Seu cardápio merece ser{' '}
                <span className="text-primary">
                  <AnimatedText words={dynamicWords} interval={2500} />
                </span>
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Compare e escolha o melhor para você
              </p>
            </div>
          </ScrollReveal>

          {/* Cards dos Planos */}
          <div className="space-y-4">
            {plans.map((plan, index) => (
              <PlanCard key={plan.name} plan={plan} index={index} />
            ))}
          </div>

          {/* Programa de Indicação */}
          <ScrollReveal delay={450}>
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-500" />
                  <h3 className="font-bold text-foreground">Programa Indique e Ganhe</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Indique amigos empreendedores! Quando eles assinarem um plano{' '}
                  <strong className="text-foreground">Pro ou Pro+</strong>, você ganha 
                  o valor do plano como{' '}
                  <strong className="text-green-500">crédito na sua próxima mensalidade</strong>!
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded-full">
                    <Users className="w-3 h-3 text-purple-400" />
                    <span className="text-purple-300">Disponível para TODOS os planos</span>
                  </span>
                  <span className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">
                    <Wallet className="w-3 h-3 text-green-400" />
                    <span className="text-green-300">Até R$ 79,90 por indicação</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Destaques informativos */}
          <ScrollReveal delay={550} direction="left">
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-3 hover:border-primary/40 transition-colors">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary animate-bounce-subtle" />
                Você sabia?
              </h3>
              
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <span className="text-lg animate-spin-slow inline-block">🍕</span>
                  <span>
                    <strong className="text-foreground">No Pro:</strong> Pizzas de 2 sabores com preço definido manualmente por você.
                    <br />
                    <strong className="text-foreground">No Pro+:</strong> Pizzas de 2, 3 ou 4 sabores com cobrança automática pelo sabor mais caro - sem cálculo manual!
                  </span>
                </p>
                
                <p className="flex items-start gap-2">
                  <span className="text-lg">📋</span>
                  <span>
                    Temos <strong className="text-foreground">templates prontos</strong> para: 
                    Pizzarias, Hamburguerias, Açaí, Farmácias, Pet Shops, Depósitos e muito mais!
                  </span>
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Garantias */}
          <ScrollReveal delay={600}>
            <div className="bg-muted/50 rounded-lg p-4 border border-muted text-center hover:bg-muted/70 transition-colors">
              <p className="text-xs text-muted-foreground">
                ✓ Cancele quando quiser • ✓ Sem fidelidade • ✓ Suporte via WhatsApp
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={700}>
            <div className="text-center pt-2">
              <img src={pedyLogo} alt="PEDY" className="h-8 mx-auto opacity-50 hover:opacity-100 transition-opacity" />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
