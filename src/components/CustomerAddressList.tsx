import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Home, Building2, MapPin, Pencil, Trash2, Plus } from 'lucide-react';

export interface CustomerAddress {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood?: string | null;
  reference_point?: string | null;
  is_default: boolean;
}

interface CustomerAddressListProps {
  addresses: CustomerAddress[];
  selectedAddressId?: string;
  onSelect: (address: CustomerAddress) => void;
  onEdit?: (address: CustomerAddress) => void;
  onDelete?: (address: CustomerAddress) => void;
  onAddNew?: () => void;
  showActions?: boolean;
}

function getAddressIcon(label: string) {
  switch (label.toLowerCase()) {
    case 'casa':
      return <Home className="w-5 h-5" />;
    case 'trabalho':
      return <Building2 className="w-5 h-5" />;
    default:
      return <MapPin className="w-5 h-5" />;
  }
}

function formatAddress(address: CustomerAddress): string {
  const parts = [address.street, address.number];
  if (address.complement) parts.push(address.complement);
  return parts.join(', ');
}

export default function CustomerAddressList({
  addresses,
  selectedAddressId,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
  showActions = false,
}: CustomerAddressListProps) {
  if (addresses.length === 0 && onAddNew) {
    return (
      <div className="text-center py-6">
        <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">Nenhum endereço cadastrado</p>
        <Button onClick={onAddNew} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar endereço
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <RadioGroup value={selectedAddressId} onValueChange={(id) => {
        const address = addresses.find(a => a.id === id);
        if (address) onSelect(address);
      }}>
        {addresses.map((address) => (
          <div
            key={address.id}
            className={`relative flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
              selectedAddressId === address.id 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:bg-muted/50'
            }`}
            onClick={() => onSelect(address)}
          >
            <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {getAddressIcon(address.label)}
                <Label htmlFor={address.id} className="font-medium cursor-pointer">
                  {address.label}
                </Label>
                {address.is_default && (
                  <Badge variant="secondary" className="text-xs">
                    Padrão
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {formatAddress(address)}
              </p>
              
              {address.neighborhood && (
                <p className="text-sm text-muted-foreground">
                  {address.neighborhood}
                </p>
              )}
              
              {address.reference_point && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ref: {address.reference_point}
                </p>
              )}
            </div>

            {showActions && (
              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(address);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(address);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </RadioGroup>

      {onAddNew && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onAddNew}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar novo endereço
        </Button>
      )}
    </div>
  );
}
