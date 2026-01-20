import { Lock, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { openWhatsApp, SUPPORT_WHATSAPP } from '@/lib/whatsapp';
import { 
  ProFeature, 
  PRO_FEATURE_LABELS, 
  generateProUpgradeMessage 
} from '@/lib/featureGating';
import { cn } from '@/lib/utils';

interface ProLockBadgeProps {
  feature: ProFeature;
  variant?: 'inline' | 'button';
  className?: string;
}

export function ProLockBadge({ feature, variant = 'inline', className }: ProLockBadgeProps) {
  const handleUpgrade = () => {
    const message = generateProUpgradeMessage();
    openWhatsApp(SUPPORT_WHATSAPP, message);
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10', className)}
        onClick={handleUpgrade}
      >
        <Lock className="w-3 h-3" />
        Upgrade para Pro
      </Button>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'gap-1 text-[10px] px-1.5 py-0.5 border-primary/30 text-primary cursor-pointer hover:bg-primary/10 transition-colors',
        className
      )}
      onClick={handleUpgrade}
    >
      <Lock className="w-2.5 h-2.5" />
      PRO
    </Badge>
  );
}

interface ProLockedOverlayProps {
  feature: ProFeature;
}

export function ProLockedOverlay({ feature }: ProLockedOverlayProps) {
  const handleUpgrade = () => {
    const message = generateProUpgradeMessage();
    openWhatsApp(SUPPORT_WHATSAPP, message);
  };

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
      <div className="text-center p-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-sm mb-1">Recurso Pro</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {PRO_FEATURE_LABELS[feature]}
        </p>
        <Button size="sm" onClick={handleUpgrade}>
          <Crown className="w-3 h-3 mr-1" />
          Upgrade para Pro
        </Button>
      </div>
    </div>
  );
}

interface ProUpgradeCardProps {
  feature: ProFeature;
}

export function ProUpgradeCard({ feature }: ProUpgradeCardProps) {
  const handleUpgrade = () => {
    const message = generateProUpgradeMessage();
    openWhatsApp(SUPPORT_WHATSAPP, message);
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-foreground mb-1">
              Recurso Exclusivo Pro
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              {PRO_FEATURE_LABELS[feature]} está disponível no <strong>Plano Pro (R$ 59,90/mês)</strong>.
            </p>
            <Button size="sm" onClick={handleUpgrade}>
              <Crown className="w-3 h-3 mr-1" />
              Fazer Upgrade
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
