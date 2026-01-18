import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeliverySettingsProps {
  establishmentId: string;
  currentFee: number;
  onUpdate: (newFee: number) => void;
}

export function DeliverySettings({ establishmentId, currentFee, onUpdate }: DeliverySettingsProps) {
  const [fee, setFee] = useState(currentFee.toString());
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const feeValue = parseFloat(fee.replace(',', '.')) || 0;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('establishments')
        .update({ delivery_fee: feeValue })
        .eq('id', establishmentId);

      if (error) throw error;

      onUpdate(feeValue);
      toast({
        title: 'Taxa atualizada!',
        description: feeValue > 0 
          ? `Taxa de entrega: R$ ${feeValue.toFixed(2).replace('.', ',')}`
          : 'Taxa de entrega removida (entrega grátis)',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a taxa.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Truck className="w-5 h-5 text-primary" />
          Taxa de Entrega
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deliveryFee">Valor da taxa (R$)</Label>
          <div className="flex gap-2">
            <Input
              id="deliveryFee"
              placeholder="0,00"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {parseFloat(fee.replace(',', '.')) > 0 
              ? `A taxa será adicionada ao total do pedido dos seus clientes.`
              : 'Deixe em 0 para oferecer entrega grátis.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
