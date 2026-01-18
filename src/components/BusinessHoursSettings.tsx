import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BusinessHour, getDayName, getAllDays } from '@/lib/businessHours';

interface BusinessHoursSettingsProps {
  establishmentId: string;
}

interface EstablishmentSettings {
  allow_orders_when_closed: boolean;
  scheduled_orders_message: string | null;
}

export function BusinessHoursSettings({ establishmentId }: BusinessHoursSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [settings, setSettings] = useState<EstablishmentSettings>({
    allow_orders_when_closed: false,
    scheduled_orders_message: null,
  });

  useEffect(() => {
    fetchData();
  }, [establishmentId]);

  const fetchData = async () => {
    try {
      // Fetch business hours
      const { data: hoursData } = await supabase
        .from('business_hours')
        .select('*')
        .eq('establishment_id', establishmentId)
        .order('day_of_week');

      // Fetch establishment settings
      const { data: estData } = await supabase
        .from('establishments')
        .select('allow_orders_when_closed, scheduled_orders_message')
        .eq('id', establishmentId)
        .single();

      // Initialize hours for all days
      const allDays = getAllDays();
      const existingHours = hoursData || [];
      
      const fullHours = allDays.map(day => {
        const existing = existingHours.find(h => h.day_of_week === day);
        if (existing) {
          return existing;
        }
        return {
          id: `new-${day}`,
          establishment_id: establishmentId,
          day_of_week: day,
          is_open: true,
          opening_time: '09:00',
          closing_time: '22:00',
        };
      });

      setHours(fullHours);
      
      if (estData) {
        setSettings({
          allow_orders_when_closed: estData.allow_orders_when_closed || false,
          scheduled_orders_message: estData.scheduled_orders_message,
        });
      }
    } catch (error) {
      console.error('Error fetching business hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateHour = (dayOfWeek: number, field: keyof BusinessHour, value: any) => {
    setHours(prev => prev.map(h => 
      h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert all hours
      for (const hour of hours) {
        const isNew = hour.id.startsWith('new-');
        
        const hourData = {
          establishment_id: establishmentId,
          day_of_week: hour.day_of_week,
          is_open: hour.is_open,
          opening_time: hour.is_open ? hour.opening_time : null,
          closing_time: hour.is_open ? hour.closing_time : null,
        };

        if (isNew) {
          await supabase.from('business_hours').insert(hourData);
        } else {
          await supabase
            .from('business_hours')
            .update(hourData)
            .eq('id', hour.id);
        }
      }

      // Update establishment settings
      await supabase
        .from('establishments')
        .update({
          allow_orders_when_closed: settings.allow_orders_when_closed,
          scheduled_orders_message: settings.scheduled_orders_message,
        })
        .eq('id', establishmentId);

      toast({
        title: 'Horários salvos!',
        description: 'Os horários de funcionamento foram atualizados.',
      });

      // Refetch to get new IDs
      fetchData();
    } catch (error: any) {
      console.error('Error saving business hours:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os horários.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-primary" />
          Horário de Funcionamento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global settings */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allow-orders" className="font-medium">
                Aceitar pedidos fora do horário
              </Label>
              <p className="text-sm text-muted-foreground">
                Permite que clientes façam pedidos mesmo quando fechado
              </p>
            </div>
            <Switch
              id="allow-orders"
              checked={settings.allow_orders_when_closed}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, allow_orders_when_closed: checked }))
              }
            />
          </div>

          {settings.allow_orders_when_closed && (
            <div className="space-y-2">
              <Label htmlFor="scheduled-message">Mensagem para pedidos agendados</Label>
              <Textarea
                id="scheduled-message"
                placeholder="Ex: Seu pedido será preparado quando reabrirmos pela manhã."
                value={settings.scheduled_orders_message || ''}
                onChange={(e) => 
                  setSettings(prev => ({ 
                    ...prev, 
                    scheduled_orders_message: e.target.value || null 
                  }))
                }
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Hours per day */}
        <div className="space-y-3">
          {hours.map((hour) => (
            <div 
              key={hour.day_of_week}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center justify-between sm:w-40">
                <span className="font-medium text-foreground">
                  {getDayName(hour.day_of_week)}
                </span>
                <Switch
                  checked={hour.is_open}
                  onCheckedChange={(checked) => 
                    updateHour(hour.day_of_week, 'is_open', checked)
                  }
                />
              </div>

              {hour.is_open && (
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">
                      Abre:
                    </Label>
                    <Input
                      type="time"
                      value={hour.opening_time?.substring(0, 5) || '09:00'}
                      onChange={(e) => 
                        updateHour(hour.day_of_week, 'opening_time', e.target.value)
                      }
                      className="w-28"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="text-sm text-muted-foreground whitespace-nowrap">
                      Fecha:
                    </Label>
                    <Input
                      type="time"
                      value={hour.closing_time?.substring(0, 5) || '22:00'}
                      onChange={(e) => 
                        updateHour(hour.day_of_week, 'closing_time', e.target.value)
                      }
                      className="w-28"
                    />
                  </div>
                </div>
              )}

              {!hour.is_open && (
                <span className="text-sm text-muted-foreground italic">
                  Fechado neste dia
                </span>
              )}
            </div>
          ))}
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar horários
        </Button>
      </CardContent>
    </Card>
  );
}
