import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Bell, History, Heart, Zap } from 'lucide-react';

interface WelcomeRegistrationPromptProps {
  establishmentId: string;
  isLoggedIn: boolean;
  onRegister: () => void;
  onSkip: () => void;
}

export function WelcomeRegistrationPrompt({
  establishmentId,
  isLoggedIn,
  onRegister,
  onSkip,
}: WelcomeRegistrationPromptProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Não mostrar se já está logado
    if (isLoggedIn) return;

    // Verificar se já foi mostrado para este estabelecimento
    const storageKey = `pedy_welcome_shown_${establishmentId}`;
    const hasShown = localStorage.getItem(storageKey);

    if (!hasShown) {
      // Mostrar na primeira visita
      setIsOpen(true);
      localStorage.setItem(storageKey, 'true');
    }
  }, [establishmentId, isLoggedIn]);

  const handleRegister = () => {
    setIsOpen(false);
    onRegister();
  };

  const handleSkip = () => {
    setIsOpen(false);
    onSkip();
  };

  if (isLoggedIn) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">Facilite seus próximos pedidos</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            Você pode criar um cadastro rápido para:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Salvar seu endereço</p>
              <p className="text-sm text-muted-foreground">Sem precisar digitar tudo de novo</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Acompanhar seus pedidos</p>
              <p className="text-sm text-muted-foreground">Status em tempo real</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <History className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-foreground">Ver pedidos anteriores</p>
              <p className="text-sm text-muted-foreground">Histórico completo</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Favoritar pratos</p>
              <p className="text-sm text-muted-foreground">Acesso rápido aos preferidos</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center mb-4">
          Se preferir, é só continuar sem cadastro.
        </p>

        <div className="flex flex-col gap-2">
          <Button onClick={handleRegister} className="w-full gap-2">
            <Zap className="w-4 h-4" />
            Criar cadastro rápido
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="w-full text-muted-foreground">
            Continuar sem cadastro →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
