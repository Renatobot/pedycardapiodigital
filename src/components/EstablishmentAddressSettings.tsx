import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EstablishmentAddressSettingsProps {
  establishmentId: string;
}

interface AddressData {
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_complement: string | null;
  show_address_on_menu: boolean | null;
  city: string | null;
  accept_pickup: boolean | null;
}

export function EstablishmentAddressSettings({ establishmentId }: EstablishmentAddressSettingsProps) {
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');
  const [city, setCity] = useState('');
  const [showOnMenu, setShowOnMenu] = useState(false);
  const [acceptPickup, setAcceptPickup] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const { data, error } = await supabase
          .from('establishments')
          .select('address_street, address_number, address_neighborhood, address_complement, city, show_address_on_menu, accept_pickup')
          .eq('id', establishmentId)
          .single();

        if (error) throw error;

        if (data) {
          setStreet(data.address_street || '');
          setNumber(data.address_number || '');
          setNeighborhood(data.address_neighborhood || '');
          setComplement(data.address_complement || '');
          setCity(data.city || '');
          setShowOnMenu(data.show_address_on_menu || false);
          setAcceptPickup(data.accept_pickup || false);
        }
      } catch (error) {
        console.error('Error fetching address:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddress();
  }, [establishmentId]);

  const handleSave = async () => {
    // Validation: if showOnMenu is true, require address fields
    if (showOnMenu && (!street.trim() || !number.trim() || !neighborhood.trim())) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Para exibir o endereço no cardápio, preencha rua, número e bairro.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('establishments')
        .update({
          address_street: street.trim() || null,
          address_number: number.trim() || null,
          address_neighborhood: neighborhood.trim() || null,
          address_complement: complement.trim() || null,
          city: city.trim() || null,
          show_address_on_menu: showOnMenu,
          accept_pickup: acceptPickup,
        })
        .eq('id', establishmentId);

      if (error) throw error;

      toast({
        title: 'Endereço salvo!',
        description: showOnMenu 
          ? 'O endereço será exibido no seu cardápio.' 
          : 'Endereço atualizado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o endereço.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-primary" />
          Endereço do Estabelecimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="street">Rua/Logradouro *</Label>
          <Input
            id="street"
            placeholder="Av. Brasil"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="number">Número *</Label>
            <Input
              id="number"
              placeholder="1234"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input
              id="complement"
              placeholder="Sala 101"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro *</Label>
            <Input
              id="neighborhood"
              placeholder="Centro"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input
              id="city"
              placeholder="Rio de Janeiro"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-2 space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="acceptPickup" className="cursor-pointer">
                Aceitar retirada no local
              </Label>
              <p className="text-xs text-muted-foreground">
                Clientes poderão buscar o pedido no estabelecimento
              </p>
            </div>
            <Switch
              id="acceptPickup"
              checked={acceptPickup}
              onCheckedChange={setAcceptPickup}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="showOnMenu" className="cursor-pointer">
                Exibir endereço no cardápio
              </Label>
              <p className="text-xs text-muted-foreground">
                Clientes verão onde fica o estabelecimento
              </p>
            </div>
            <Switch
              id="showOnMenu"
              checked={showOnMenu}
              onCheckedChange={setShowOnMenu}
            />
          </div>

          {showOnMenu && !acceptPickup && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded">
              💡 Dica: Ative também "Aceitar retirada no local" para que os clientes possam buscar pedidos no endereço.
            </p>
          )}
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Salvar Endereço
        </Button>
      </CardContent>
    </Card>
  );
}
