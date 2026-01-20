import { useState } from 'react';
import { Bell, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface CustomerPushPromptProps {
  isOpen: boolean;
  onClose: () => void;
  establishmentId: string;
  establishmentName: string;
  customerPhone: string;
  customerId?: string;
}

export function CustomerPushPrompt({
  isOpen,
  onClose,
  establishmentId,
  establishmentName,
  customerPhone,
  customerId,
}: CustomerPushPromptProps) {
  const { isSupported, permission, subscribe, isLoading } = usePushNotifications();
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async () => {
    const success = await subscribe(establishmentId, customerPhone, customerId);
    if (success) {
      setSubscribed(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  // Não mostrar se não suportado ou se permissão já foi negada
  if (!isSupported || permission === 'denied') {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {subscribed ? (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-center text-lg">
              Notificações ativadas!
            </DialogTitle>
            <DialogDescription className="text-center">
              Você receberá atualizações sobre seu pedido diretamente no seu dispositivo.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-center text-lg">
                Quer acompanhar seu pedido?
              </DialogTitle>
              <DialogDescription className="text-center">
                Ative as notificações para receber atualizações sobre seu pedido de{' '}
                <span className="font-medium">{establishmentName}</span> em tempo real.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <span>Saiba quando seu pedido for confirmado</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <span>Receba aviso quando sair para entrega</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <span>Fique tranquilo acompanhando tudo</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  'Ativando...'
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    Ativar notificações
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="w-full"
              >
                Agora não
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
