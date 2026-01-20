import { Link } from 'react-router-dom';
import pedyLogo from '@/assets/logo_pedy.jpg';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, CheckCircle2, XCircle, MessageCircle, ArrowLeft, Smartphone, Sparkles, Lightbulb } from 'lucide-react';
import { openWhatsApp, SUPPORT_WHATSAPP } from '@/lib/whatsapp';
import { Badge } from '@/components/ui/badge';

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
}

const PlanCard = ({ plan }: PlanCardProps) => {
  const Icon = plan.icon;
  
  return (
    <Card className={`shadow-soft overflow-hidden transition-all ${
      plan.highlighted 
        ? 'ring-2 ring-primary/50 border-primary/30 scale-[1.02]' 
        : 'border-muted'
    }`}>
      <div className={`p-4 text-center ${plan.headerClass} ${plan.highlighted ? 'text-primary-foreground' : ''}`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Icon className={`w-5 h-5 ${plan.highlighted ? 'text-primary-foreground' : plan.colorClass}`} />
          <span className={`font-bold ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
            {plan.name}
          </span>
          {plan.badge && (
            <Badge className="bg-primary-foreground/20 text-primary-foreground text-[10px] px-1.5">
              {plan.badge}
            </Badge>
          )}
        </div>
        <div className={`flex items-baseline justify-center gap-1 ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
          <span className="text-sm">R$</span>
          <span className="text-4xl font-bold">{plan.price.toFixed(2).replace('.', ',')}</span>
          <span className={plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}>/mês</span>
        </div>
      </div>
      
      <CardContent className="pt-4">
        {/* Recursos incluídos */}
        <ul className="space-y-2 mb-3">
          {plan.included.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* Recursos NÃO incluídos */}
        {plan.excluded.length > 0 && (
          <ul className="space-y-2 mb-4">
            {plan.excluded.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground/70">
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="line-through">{feature}</span>
              </li>
            ))}
          </ul>
        )}
        
        <Button 
          variant={plan.highlighted ? "whatsapp" : "outline"}
          size="lg"
          className="w-full"
          onClick={() => openWhatsApp(SUPPORT_WHATSAPP, plan.message)}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Ativar {plan.name}
        </Button>
      </CardContent>
    </Card>
  );
};

export default function UpgradePage() {
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
        <div className="w-full max-w-md animate-fade-in space-y-4">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-foreground">Escolha seu Plano</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Compare e escolha o melhor para você
            </p>
          </div>

          {/* Cards dos Planos */}
          <div className="space-y-4">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>

          {/* Destaques informativos */}
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Você sabia?
            </h3>
            
            <div className="space-y-2 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <span>🍕</span>
                <span>
                  <strong className="text-foreground">No Pro:</strong> Pizzas de 2 sabores com preço definido manualmente por você.
                  <br />
                  <strong className="text-foreground">No Pro+:</strong> Pizzas de 2, 3 ou 4 sabores com cobrança automática pelo sabor mais caro - sem cálculo manual!
                </span>
              </p>
              
              <p className="flex items-start gap-2">
                <span>📋</span>
                <span>
                  Temos <strong className="text-foreground">templates prontos</strong> para: 
                  Pizzarias, Hamburguerias, Açaí, Farmácias, Pet Shops, Depósitos e muito mais!
                </span>
              </p>
            </div>
          </div>

          {/* Garantias */}
          <div className="bg-muted/50 rounded-lg p-4 border border-muted text-center">
            <p className="text-xs text-muted-foreground">
              ✓ Cancele quando quiser • ✓ Sem fidelidade • ✓ Suporte via WhatsApp
            </p>
          </div>

          <div className="text-center pt-2">
            <img src={pedyLogo} alt="PEDY" className="h-8 mx-auto opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
