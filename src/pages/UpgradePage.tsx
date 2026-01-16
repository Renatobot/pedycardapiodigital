import { Link } from 'react-router-dom';
import pedyLogo from '@/assets/logo_pedy.jpg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, CheckCircle2, MessageCircle, ArrowLeft } from 'lucide-react';
import { openWhatsApp, generateUpgradeMessage } from '@/lib/whatsapp';

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
    // Replace with your business WhatsApp number
    openWhatsApp('5511999999999', generateUpgradeMessage());
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
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Crown className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Plano Pro</h1>
            <p className="text-muted-foreground mt-1">
              Desbloqueie todo o potencial do PEDY
            </p>
          </div>

          <Card className="shadow-soft mb-6 overflow-hidden">
            <div className="bg-gradient-hero p-4 text-center">
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

          <div className="text-center">
            <img src={pedyLogo} alt="PEDY" className="h-8 mx-auto opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
