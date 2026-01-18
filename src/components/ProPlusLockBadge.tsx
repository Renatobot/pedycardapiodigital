import { Lock, Sparkles, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  PRO_PLUS_FEATURES, 
  ProPlusFeature, 
  FEATURE_LABELS,
  PRO_PLUS_PRICE,
  generateProPlusUpgradeMessage 
} from '@/lib/featureGating';
import { openWhatsApp, SUPPORT_WHATSAPP } from '@/lib/whatsapp';

interface ProPlusLockBadgeProps {
  feature: ProPlusFeature;
  variant?: 'inline' | 'button';
  className?: string;
}

export function ProPlusLockBadge({ 
  feature, 
  variant = 'inline',
  className = '' 
}: ProPlusLockBadgeProps) {
  const handleUpgrade = () => {
    const message = generateProPlusUpgradeMessage(FEATURE_LABELS[feature]);
    openWhatsApp(SUPPORT_WHATSAPP, message);
  };

  if (variant === 'button') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleUpgrade}
        className={`gap-1 text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground ${className}`}
      >
        <Sparkles className="w-3 h-3" />
        Ativar Pro+
      </Button>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`gap-1 text-primary border-primary/30 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors ${className}`}
      onClick={handleUpgrade}
    >
      <Lock className="w-3 h-3" />
      Pro+
    </Badge>
  );
}

interface ProPlusLockedOverlayProps {
  feature: ProPlusFeature;
}

export function ProPlusLockedOverlay({ feature }: ProPlusLockedOverlayProps) {
  const handleUpgrade = () => {
    const message = generateProPlusUpgradeMessage(FEATURE_LABELS[feature]);
    openWhatsApp(SUPPORT_WHATSAPP, message);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary/30 z-10">
      <div className="text-center p-4">
        <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground mb-1">
          Recurso avançado disponível no Pro+
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          {FEATURE_LABELS[feature]}
        </p>
        <Button size="sm" onClick={handleUpgrade}>
          <Sparkles className="w-4 h-4 mr-1" />
          Ativar recursos avançados
        </Button>
      </div>
    </div>
  );
}

interface ProPlusUpgradeCardProps {
  feature: ProPlusFeature;
}

export function ProPlusUpgradeCard({ feature }: ProPlusUpgradeCardProps) {
  const handleUpgrade = () => {
    openWhatsApp(SUPPORT_WHATSAPP, 'Quero atualizar para o plano Pro+');
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary/30 z-10">
      <div className="text-center p-6 max-w-sm">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        
        <h3 className="font-semibold text-lg mb-1">Recurso Pro+</h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          {FEATURE_LABELS[feature]}
        </p>
        
        <div className="bg-primary/5 rounded-lg p-3 mb-4">
          <p className="text-xs text-muted-foreground">Plano Pro+</p>
          <p className="text-2xl font-bold text-primary">
            R$ {PRO_PLUS_PRICE},00<span className="text-sm font-normal text-muted-foreground">/mês</span>
          </p>
        </div>
        
        <Button onClick={handleUpgrade} className="w-full gap-2">
          <MessageCircle className="w-4 h-4" />
          Atualizar para Pro+
        </Button>
      </div>
    </div>
  );
}

export { PRO_PLUS_FEATURES };
