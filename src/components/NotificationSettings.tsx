import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  establishmentId: string;
  initialEnabled?: boolean;
}

export function NotificationSettings({ establishmentId, initialEnabled = true }: NotificationSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('establishments')
        .update({ notify_customer_on_status_change: checked })
        .eq('id', establishmentId);

      if (error) throw error;

      setEnabled(checked);
      toast({
        title: checked ? 'Notificações ativadas!' : 'Notificações desativadas',
        description: checked 
          ? 'Os clientes serão notificados via WhatsApp quando o status mudar.'
          : 'Os clientes não receberão notificações automáticas.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a configuração.',
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
          <MessageCircle className="w-5 h-5 text-primary" />
          Notificações ao Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notify-customer">Avisar cliente sobre status do pedido</Label>
            <p className="text-xs text-muted-foreground">
              Ao atualizar o status do pedido, abre o WhatsApp com mensagem pronta para o cliente
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            <Switch 
              id="notify-customer"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={isSaving}
            />
          </div>
        </div>
        
        {enabled && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-xs font-medium text-foreground">Mensagens automáticas enviadas:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>📦 <strong>Recebido:</strong> "Seu pedido foi recebido e já estamos preparando..."</li>
              <li>👨‍🍳 <strong>Em preparo:</strong> "Seu pedido já está em preparo!"</li>
              <li>🛵 <strong>A caminho:</strong> "Seu pedido saiu para entrega!"</li>
              <li>✅ <strong>Entregue:</strong> "Pedido entregue! Obrigado pela preferência!"</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}