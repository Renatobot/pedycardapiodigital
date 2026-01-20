import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCustomer } from '@/hooks/useCustomer';
import CustomerRegistrationForm from './CustomerRegistrationForm';
import { User, UserPlus, ArrowRight, Loader2 } from 'lucide-react';

interface CustomerIdentificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  establishmentName: string;
  onSuccess?: () => void;
}

export default function CustomerIdentificationModal({
  open,
  onOpenChange,
  establishmentName,
  onSuccess,
}: CustomerIdentificationModalProps) {
  const [mode, setMode] = useState<'choose' | 'login' | 'register'>('choose');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useCustomer();
  const { toast } = useToast();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleLogin = async () => {
    if (whatsapp.replace(/\D/g, '').length < 10) {
      toast({
        title: 'WhatsApp inválido',
        description: 'Digite um número de WhatsApp válido',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const result = await login(whatsapp);
    setLoading(false);

    if (result.success) {
      toast({
        title: `Bem-vindo, ${result.customer?.name}!`,
        description: 'Seus favoritos foram carregados',
      });
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast({
        title: 'Cadastro não encontrado',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleRegisterSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleContinueWithoutLogin = () => {
    onOpenChange(false);
  };

  const resetModal = () => {
    setMode('choose');
    setWhatsapp('');
    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetModal();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="max-w-md mx-auto">
        {mode === 'choose' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl">
                Bem-vindo ao {establishmentName}!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Login Option */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Já é cliente?</p>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => setMode('login')}
                >
                  <User className="w-5 h-5" />
                  Entrar com meu cadastro
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Register Option */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Primeira vez aqui?</p>
                <Button
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => setMode('register')}
                >
                  <UserPlus className="w-5 h-5" />
                  Criar meu cadastro
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
              </div>

              {/* Continue without login */}
              <button
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 py-2"
                onClick={handleContinueWithoutLogin}
              >
                Continuar sem cadastro
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-center text-muted-foreground">
                Você informará seus dados ao finalizar o pedido
              </p>
            </div>
          </>
        )}

        {mode === 'login' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('choose')}
                  className="p-1 h-auto"
                >
                  ←
                </Button>
                <DialogTitle>Entrar com meu cadastro</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="login-whatsapp">WhatsApp</Label>
                <Input
                  id="login-whatsapp"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  maxLength={15}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleLogin}
                disabled={loading || whatsapp.replace(/\D/g, '').length < 10}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Não tem cadastro?{' '}
                <button
                  className="text-primary hover:underline"
                  onClick={() => setMode('register')}
                >
                  Criar agora
                </button>
              </p>
            </div>
          </>
        )}

        {mode === 'register' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('choose')}
                  className="p-1 h-auto"
                >
                  ←
                </Button>
                <DialogTitle>Criar meu cadastro</DialogTitle>
              </div>
            </DialogHeader>

            <CustomerRegistrationForm onSuccess={handleRegisterSuccess} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
