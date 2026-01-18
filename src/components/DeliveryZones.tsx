import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Truck, Plus, Edit, Trash2, Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryZone {
  id: string;
  neighborhood: string;
  delivery_type: 'paid' | 'free';
  delivery_fee: number;
  is_active: boolean;
}

interface DeliveryZonesProps {
  establishmentId: string;
  currentSettings: {
    delivery_fee: number;
    min_order_value: number;
    free_delivery_min: number | null;
    accept_pickup: boolean;
  };
  onSettingsUpdate: (settings: {
    delivery_fee?: number;
    min_order_value?: number;
    free_delivery_min?: number | null;
    accept_pickup?: boolean;
  }) => void;
}

export function DeliveryZones({ establishmentId, currentSettings, onSettingsUpdate }: DeliveryZonesProps) {
  const { toast } = useToast();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    neighborhood: '',
    deliveryType: 'paid' as 'paid' | 'free',
    deliveryFee: '',
  });

  // Settings state
  const [settings, setSettings] = useState({
    defaultFee: currentSettings.delivery_fee.toString(),
    minOrderValue: currentSettings.min_order_value.toString(),
    freeDeliveryMin: currentSettings.free_delivery_min?.toString() || '',
    acceptPickup: currentSettings.accept_pickup,
  });

  useEffect(() => {
    fetchZones();
  }, [establishmentId]);

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('neighborhood');

      if (error) throw error;
      setZones((data || []).map(z => ({
        ...z,
        delivery_type: z.delivery_type as 'paid' | 'free',
      })));
    } catch (error) {
      console.error('Error fetching delivery zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = {
        delivery_fee: parseFloat(settings.defaultFee.replace(',', '.')) || 0,
        min_order_value: parseFloat(settings.minOrderValue.replace(',', '.')) || 0,
        free_delivery_min: settings.freeDeliveryMin 
          ? parseFloat(settings.freeDeliveryMin.replace(',', '.')) 
          : null,
        accept_pickup: settings.acceptPickup,
      };

      const { error } = await supabase
        .from('establishments')
        .update(updates)
        .eq('id', establishmentId);

      if (error) throw error;

      onSettingsUpdate(updates);
      toast({
        title: 'Configurações salvas!',
        description: 'As configurações de entrega foram atualizadas.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openAddZone = () => {
    setEditingZone(null);
    setFormData({ neighborhood: '', deliveryType: 'paid', deliveryFee: '' });
    setModalOpen(true);
  };

  const openEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setFormData({
      neighborhood: zone.neighborhood,
      deliveryType: zone.delivery_type,
      deliveryFee: zone.delivery_fee.toString(),
    });
    setModalOpen(true);
  };

  const handleSaveZone = async () => {
    if (!formData.neighborhood.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do bairro é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const zoneData = {
        establishment_id: establishmentId,
        neighborhood: formData.neighborhood.trim(),
        delivery_type: formData.deliveryType,
        delivery_fee: formData.deliveryType === 'free' 
          ? 0 
          : parseFloat(formData.deliveryFee.replace(',', '.')) || 0,
        is_active: true,
      };

      if (editingZone) {
        const { error } = await supabase
          .from('delivery_zones')
          .update(zoneData)
          .eq('id', editingZone.id);

        if (error) throw error;
        
        setZones(prev => prev.map(z => 
          z.id === editingZone.id ? { ...z, ...zoneData } : z
        ));
        toast({ title: 'Bairro atualizado!' });
      } else {
        const { data, error } = await supabase
          .from('delivery_zones')
          .insert(zoneData)
          .select()
          .single();

        if (error) throw error;
        setZones(prev => [...prev, data as DeliveryZone]);
        toast({ title: 'Bairro adicionado!' });
      }

      setModalOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o bairro.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_zones')
        .delete()
        .eq('id', zoneId);

      if (error) throw error;
      setZones(prev => prev.filter(z => z.id !== zoneId));
      toast({ title: 'Bairro removido!' });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível remover o bairro.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Configurações de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultFee">Taxa padrão (R$)</Label>
              <Input
                id="defaultFee"
                placeholder="0,00"
                value={settings.defaultFee}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultFee: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Usada quando o bairro não está cadastrado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minOrderValue">Valor mínimo do pedido (R$)</Label>
              <Input
                id="minOrderValue"
                placeholder="0,00"
                value={settings.minOrderValue}
                onChange={(e) => setSettings(prev => ({ ...prev, minOrderValue: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="freeDeliveryMin">Entrega grátis acima de (R$)</Label>
            <Input
              id="freeDeliveryMin"
              placeholder="Deixe vazio para desativar"
              value={settings.freeDeliveryMin}
              onChange={(e) => setSettings(prev => ({ ...prev, freeDeliveryMin: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Entrega grátis para pedidos acima deste valor
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <Label htmlFor="acceptPickup">Aceitar retirada no local</Label>
              <p className="text-xs text-muted-foreground">
                Clientes podem buscar o pedido
              </p>
            </div>
            <Switch
              id="acceptPickup"
              checked={settings.acceptPickup}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, acceptPickup: checked }))}
            />
          </div>

          <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Salvar configurações
          </Button>
        </CardContent>
      </Card>

      {/* Delivery Zones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Bairros Cadastrados
            </CardTitle>
            <Button size="sm" onClick={openAddZone}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum bairro cadastrado. Adicione bairros para definir taxas específicas.
            </p>
          ) : (
            <div className="space-y-2">
              {zones.map((zone) => (
                <div 
                  key={zone.id} 
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{zone.neighborhood}</p>
                    <p className="text-sm text-muted-foreground">
                      {zone.delivery_type === 'free' 
                        ? 'Entrega grátis' 
                        : `R$ ${zone.delivery_fee.toFixed(2).replace('.', ',')}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => openEditZone(zone)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDeleteZone(zone.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zone Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Editar bairro' : 'Adicionar bairro'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Nome do bairro</Label>
              <Input
                id="neighborhood"
                placeholder="Ex: Centro, Jardim América..."
                value={formData.neighborhood}
                onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de entrega</Label>
              <Select 
                value={formData.deliveryType} 
                onValueChange={(value: 'paid' | 'free') => setFormData(prev => ({ ...prev, deliveryType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Entrega paga</SelectItem>
                  <SelectItem value="free">Entrega grátis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.deliveryType === 'paid' && (
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Taxa de entrega (R$)</Label>
                <Input
                  id="deliveryFee"
                  placeholder="0,00"
                  value={formData.deliveryFee}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryFee: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveZone} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingZone ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
