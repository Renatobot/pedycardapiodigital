import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCustomer } from '@/hooks/useCustomer';
import { Loader2 } from 'lucide-react';

interface CustomerRegistrationFormProps {
  onSuccess?: () => void;
}

export default function CustomerRegistrationForm({ onSuccess }: CustomerRegistrationFormProps) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useCustomer();
  const { toast } = useToast();

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite seu nome completo',
        variant: 'destructive',
      });
      return;
    }

    if (whatsapp.replace(/\D/g, '').length < 10) {
      toast({
        title: 'WhatsApp inválido',
        description: 'Digite um número de WhatsApp válido',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const result = await register({
      name: name.trim(),
      whatsapp,
    });
    setLoading(false);

    if (result.success) {
      toast({
        title: 'Cadastro criado!',
        description: `Bem-vindo, ${result.customer?.name}!`,
      });
      onSuccess?.();
    } else {
      toast({
        title: 'Erro ao criar cadastro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="register-name">Nome completo *</Label>
        <Input
          id="register-name"
          placeholder="Seu nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-whatsapp">WhatsApp *</Label>
        <Input
          id="register-whatsapp"
          type="tel"
          placeholder="(00) 00000-0000"
          value={whatsapp}
          onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
          maxLength={15}
          required
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Você poderá cadastrar seu endereço no momento do pedido.
      </p>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Criando cadastro...
          </>
        ) : (
          'Criar cadastro'
        )}
      </Button>
    </form>
  );
}
