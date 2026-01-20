import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';

interface CartRegistrationBannerProps {
  establishmentId: string;
  customerPhone?: string;
  isLoggedIn: boolean;
  onRegister: () => void;
}

export function CartRegistrationBanner({
  establishmentId,
  customerPhone,
  isLoggedIn,
  onRegister,
}: CartRegistrationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Não mostrar se logado ou dispensou
    if (isLoggedIn || isDismissed) {
      setIsVisible(false);
      return;
    }

    // Verificar contador de pedidos para este telefone/estabelecimento
    const normalizedPhone = customerPhone?.replace(/\D/g, '') || 'anonymous';
    const storageKey = `pedy_order_count_${establishmentId}_${normalizedPhone}`;
    const orderCount = parseInt(localStorage.getItem(storageKey) || '0', 10);

    // Mostrar apenas a partir da 2ª compra (orderCount >= 1)
    if (orderCount >= 1) {
      setIsVisible(true);
    }
  }, [establishmentId, customerPhone, isLoggedIn, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dispensar"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3 pr-6">
        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Quer ganhar tempo nos próximos pedidos?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Com um cadastro rápido, seus dados ficam salvos.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={onRegister}
            className="h-auto p-0 mt-1 text-primary"
          >
            Criar cadastro rápido →
          </Button>
        </div>
      </div>
    </div>
  );
}
