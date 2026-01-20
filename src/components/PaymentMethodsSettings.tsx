import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CreditCard, Banknote, QrCode, Loader2, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodsSettingsProps {
  establishmentId: string;
  initialSettings?: {
    accept_pix: boolean;
    accept_cash: boolean;
    accept_credit: boolean;
    accept_debit: boolean;
    cash_change_available: boolean;
    pix_key: string | null;
  };
}

export function PaymentMethodsSettings({ establishmentId, initialSettings }: PaymentMethodsSettingsProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    accept_pix: initialSettings?.accept_pix ?? true,
    accept_cash: initialSettings?.accept_cash ?? true,
    accept_credit: initialSettings?.accept_credit ?? true,
    accept_debit: initialSettings?.accept_debit ?? true,
    cash_change_available: initialSettings?.cash_change_available ?? true,
    pix_key: initialSettings?.pix_key || '',
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings({
        accept_pix: initialSettings.accept_pix ?? true,
        accept_cash: initialSettings.accept_cash ?? true,
        accept_credit: initialSettings.accept_credit ?? true,
        accept_debit: initialSettings.accept_debit ?? true,
        cash_change_available: initialSettings.cash_change_available ?? true,
        pix_key: initialSettings.pix_key || '',
      });
    }
  }, [initialSettings]);

  // Ensure at least one payment method is active
  const canDisable = (method: keyof typeof settings) => {
    const otherMethods = ['accept_pix', 'accept_cash', 'accept_credit', 'accept_debit'].filter(m => m !== method);
    return otherMethods.some(m => settings[m as keyof typeof settings]);
  };

  const handleToggle = (method: keyof typeof settings, value: boolean) => {
    if (!value && !canDisable(method)) {
      toast({
        title: 'Erro',
        description: 'Pelo menos uma forma de pagamento deve estar ativa.',
        variant: 'destructive',
      });
      return;
    }
    setSettings(prev => ({ ...prev, [method]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('establishments')
        .update({
          accept_pix: settings.accept_pix,
          accept_cash: settings.accept_cash,
          accept_credit: settings.accept_credit,
          accept_debit: settings.accept_debit,
          cash_change_available: settings.cash_change_available,
          pix_key: settings.pix_key || null,
        })
        .eq('id', establishmentId);

      if (error) throw error;

      toast({
        title: 'Configurações salvas!',
        description: 'As formas de pagamento foram atualizadas.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações.',
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
          <Wallet className="w-5 h-5 text-primary" />
          Central de Pagamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-green-600" />
              <Label htmlFor="accept_pix" className="font-medium">Pix</Label>
            </div>
            <Switch
              id="accept_pix"
              checked={settings.accept_pix}
              onCheckedChange={(checked) => handleToggle('accept_pix', checked)}
            />
          </div>
          {settings.accept_pix && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="pix_key" className="text-sm text-muted-foreground">Chave Pix</Label>
              <Input
                id="pix_key"
                placeholder="CPF, CNPJ, E-mail ou Telefone"
                value={settings.pix_key}
                onChange={(e) => setSettings(prev => ({ ...prev, pix_key: e.target.value }))}
              />
            </div>
          )}
        </div>

        {/* Dinheiro */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-green-700" />
              <Label htmlFor="accept_cash" className="font-medium">Dinheiro</Label>
            </div>
            <Switch
              id="accept_cash"
              checked={settings.accept_cash}
              onCheckedChange={(checked) => handleToggle('accept_cash', checked)}
            />
          </div>
          {settings.accept_cash && (
            <div className="ml-6 flex items-center justify-between">
              <Label htmlFor="cash_change" className="text-sm text-muted-foreground">Oferecemos troco</Label>
              <Switch
                id="cash_change"
                checked={settings.cash_change_available}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, cash_change_available: checked }))}
              />
            </div>
          )}
        </div>

        {/* Cartão de Crédito */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <Label htmlFor="accept_credit" className="font-medium">Cartão de Crédito</Label>
          </div>
          <Switch
            id="accept_credit"
            checked={settings.accept_credit}
            onCheckedChange={(checked) => handleToggle('accept_credit', checked)}
          />
        </div>

        {/* Cartão de Débito */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-600" />
            <Label htmlFor="accept_debit" className="font-medium">Cartão de Débito</Label>
          </div>
          <Switch
            id="accept_debit"
            checked={settings.accept_debit}
            onCheckedChange={(checked) => handleToggle('accept_debit', checked)}
          />
        </div>

        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
