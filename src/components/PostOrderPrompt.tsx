import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Zap, History } from 'lucide-react';

interface PostOrderPromptProps {
  isOpen: boolean;
  onClose: () => void;
  isRegistered: boolean;
  onRegister: () => void;
  onViewOrders: () => void;
}

export function PostOrderPrompt({
  isOpen,
  onClose,
  isRegistered,
  onRegister,
  onViewOrders,
}: PostOrderPromptProps) {
  if (isRegistered) {
    // Cliente COM cadastro
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl">Pedido enviado com sucesso!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Seu pedido já foi enviado para o estabelecimento.
              Você pode acompanhar seus pedidos e ver seus favoritos sempre que quiser.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={onViewOrders} className="w-full gap-2">
              <History className="w-4 h-4" />
              Ver meus pedidos
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
              Voltar ao cardápio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Cliente SEM cadastro
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-xl">Pedido enviado com sucesso!</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Deseja salvar seus dados para facilitar seus próximos pedidos?
            <br />
            <span className="text-muted-foreground">
              Com um cadastro rápido, você não precisa digitar tudo novamente.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-4">
          <Button onClick={onRegister} className="w-full gap-2">
            <Zap className="w-4 h-4" />
            Criar cadastro rápido
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
            Agora não →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
