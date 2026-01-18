import { Link } from 'react-router-dom';
import pedyLogo from '@/assets/logo_pedy.jpg';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, CheckCircle2, MessageCircle, ArrowLeft, Clock, X } from 'lucide-react';
import { openWhatsApp, generateUpgradeMessage, SUPPORT_WHATSAPP } from '@/lib/whatsapp';

const trialFeatures = [
  'Cardápio digital',
  'Até 5 categorias',
  'Até 10 produtos',
  'Pedidos via WhatsApp',
];

const trialLimitations = [
  'Sem configurações avançadas',
];

const benefits = [
  'Cardápio digital ilimitado',
  'Produtos e categorias ilimitados',
  'Receba pedidos via WhatsApp',
  'Sem taxa por pedido',
  'Suporte prioritário',
  'Atualizações gratuitas',
  'Painel de controle completo',
  'Configuração de Pix',
];

export default function UpgradePage() {
  const handleUpgrade = () => {
    openWhatsApp(SUPPORT_WHATSAPP, generateUpgradeMessage());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in space-y-4">
          <div className="text-center mb-2">
            <h1 className="text-2xl font-bold text-foreground">Escolha seu Plano</h1>
            <p className="text-muted-foreground mt-1">
              Compare os recursos e escolha o melhor para você
            </p>
          </div>

          {/* Plano Grátis / Trial */}
          <Card className="shadow-soft border-muted">
            <div className="bg-muted p-4 text-center rounded-t-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold text-foreground">PLANO GRÁTIS</span>
              </div>
              <div className="flex items-baseline justify-center gap-1 text-foreground">
                <span className="text-sm">R$</span>
                <span className="text-4xl font-bold">0</span>
                <span className="text-muted-foreground">/7 dias</span>
              </div>
            </div>
            
            <CardContent className="pt-4">
              <ul className="space-y-2 mb-4">
                {trialFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
                {trialLimitations.map((limitation, index) => (
                  <li key={index} className="flex items-center gap-3 text-muted-foreground">
                    <X className="w-4 h-4 text-destructive/60 flex-shrink-0" />
                    <span className="text-sm">{limitation}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-center text-muted-foreground">
                Teste gratuito por 7 dias, sem compromisso
              </p>
            </CardContent>
          </Card>

          {/* Plano Pro */}
          <Card className="shadow-soft overflow-hidden border-primary/30 ring-2 ring-primary/20">
            <div className="bg-gradient-hero p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Crown className="w-5 h-5 text-primary-foreground" />
                <span className="font-semibold text-primary-foreground">PLANO PRO</span>
                <span className="text-xs bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full">
                  RECOMENDADO
                </span>
              </div>
              <div className="flex items-baseline justify-center gap-1 text-primary-foreground">
                <span className="text-sm">R$</span>
                <span className="text-5xl font-bold">37</span>
                <span>/mês</span>
              </div>
            </div>
            
            <CardContent className="pt-6">
              <ul className="space-y-3 mb-6">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant="whatsapp" 
                size="lg" 
                className="w-full"
                onClick={handleUpgrade}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Ativar Plano Pro
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                Ao clicar, você será direcionado ao WhatsApp para finalizar a ativação do seu plano.
              </p>
            </CardContent>
          </Card>

          <div className="text-center pt-2">
            <img src={pedyLogo} alt="PEDY" className="h-8 mx-auto opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
