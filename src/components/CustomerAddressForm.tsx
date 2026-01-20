import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export interface AddressFormData {
  label: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  referencePoint: string;
  isDefault: boolean;
}

interface CustomerAddressFormProps {
  initialData?: Partial<AddressFormData>;
  deliveryZones?: Array<{ neighborhood: string }>;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export default function CustomerAddressForm({
  initialData,
  deliveryZones = [],
  onSubmit,
  onCancel,
  submitLabel = 'Salvar endereço',
  loading = false,
}: CustomerAddressFormProps) {
  const [formData, setFormData] = useState<AddressFormData>({
    label: initialData?.label || 'Casa',
    street: initialData?.street || '',
    number: initialData?.number || '',
    complement: initialData?.complement || '',
    neighborhood: initialData?.neighborhood || '',
    referencePoint: initialData?.referencePoint || '',
    isDefault: initialData?.isDefault || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const labels = ['Casa', 'Trabalho', 'Outro'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Apelido do endereço</Label>
        <div className="flex gap-2">
          {labels.map((label) => (
            <Button
              key={label}
              type="button"
              variant={formData.label === label ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormData(prev => ({ ...prev, label }))}
            >
              {label === 'Casa' && '🏠'}
              {label === 'Trabalho' && '🏢'}
              {label === 'Outro' && '📍'}
              {' '}{label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addr-street">Rua/Avenida *</Label>
        <Input
          id="addr-street"
          placeholder="Nome da rua ou avenida"
          value={formData.street}
          onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="addr-number">Número *</Label>
          <Input
            id="addr-number"
            placeholder="123"
            value={formData.number}
            onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="addr-complement">Complemento</Label>
          <Input
            id="addr-complement"
            placeholder="Apto, bloco..."
            value={formData.complement}
            onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addr-neighborhood">Bairro</Label>
        {deliveryZones.length > 0 ? (
          <Select
            value={formData.neighborhood}
            onValueChange={(value) => setFormData(prev => ({ ...prev, neighborhood: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o bairro" />
            </SelectTrigger>
            <SelectContent>
              {deliveryZones.map((zone) => (
                <SelectItem key={zone.neighborhood} value={zone.neighborhood}>
                  {zone.neighborhood}
                </SelectItem>
              ))}
              <SelectItem value="outros">Outro bairro</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            id="addr-neighborhood"
            placeholder="Nome do bairro"
            value={formData.neighborhood}
            onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="addr-reference">Ponto de referência</Label>
        <Input
          id="addr-reference"
          placeholder="Próximo ao mercado..."
          value={formData.referencePoint}
          onChange={(e) => setFormData(prev => ({ ...prev, referencePoint: e.target.value }))}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="addr-default"
          checked={formData.isDefault}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: !!checked }))}
        />
        <Label htmlFor="addr-default" className="text-sm text-muted-foreground cursor-pointer">
          Definir como endereço padrão
        </Label>
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
