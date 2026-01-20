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
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [referencePoint, setReferencePoint] = useState('');
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
      street: street.trim() || undefined,
      number: number.trim() || undefined,
      complement: complement.trim() || undefined,
      neighborhood: neighborhood.trim() || undefined,
      reference_point: referencePoint.trim() || undefined,
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
      {/* Required fields */}
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

      {/* Optional address fields */}
      <div className="pt-2">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Endereço de entrega (opcional)
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-street">Rua/Avenida</Label>
        <Input
          id="register-street"
          placeholder="Nome da rua ou avenida"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="register-number">Número</Label>
          <Input
            id="register-number"
            placeholder="123"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-complement">Complemento</Label>
          <Input
            id="register-complement"
            placeholder="Apto, bloco..."
            value={complement}
            onChange={(e) => setComplement(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-neighborhood">Bairro</Label>
        <Input
          id="register-neighborhood"
          placeholder="Nome do bairro"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-reference">Ponto de referência</Label>
        <Input
          id="register-reference"
          placeholder="Próximo ao mercado..."
          value={referencePoint}
          onChange={(e) => setReferencePoint(e.target.value)}
        />
      </div>

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
