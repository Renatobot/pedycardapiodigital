import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  UserPlus,
  DollarSign,
  Percent,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResellerCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<any>;
  loading: boolean;
}

const MIN_PRICES = {
  basic: 37,
  pro: 59.90,
  pro_plus: 79.90,
};

export const ResellerCreateModal = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  loading 
}: ResellerCreateModalProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [accessType, setAccessType] = useState<'all' | 'own_only'>('own_only');
  const [pricingMode, setPricingMode] = useState<'custom_price' | 'commission'>('commission');
  const [priceBasic, setPriceBasic] = useState(MIN_PRICES.basic);
  const [pricePro, setPricePro] = useState(MIN_PRICES.pro);
  const [priceProPlus, setPriceProPlus] = useState(MIN_PRICES.pro_plus);
  const [commissionPercentage, setCommissionPercentage] = useState(10);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate referral code from name
  const generateReferralCode = (name: string) => {
    const base = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${base}${random}`;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (value.length >= 3) {
      setReferralCode(generateReferralCode(value));
    }
  };

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      toast({
        title: 'Erro',
        description: 'Preencha nome, email e senha.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    // Validate prices if custom_price mode
    if (pricingMode === 'custom_price') {
      if (priceBasic < MIN_PRICES.basic || pricePro < MIN_PRICES.pro || priceProPlus < MIN_PRICES.pro_plus) {
        toast({
          title: 'Erro',
          description: 'Os preços não podem ser menores que os valores mínimos.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Validate commission if commission mode
    if (pricingMode === 'commission') {
      if (commissionPercentage < 0 || commissionPercentage > 50) {
        toast({
          title: 'Erro',
          description: 'A comissão deve estar entre 0% e 50%.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      await onSubmit({
        name,
        email,
        password,
        whatsapp: whatsapp || undefined,
        access_type: accessType,
        pricing_mode: pricingMode,
        price_basic: pricingMode === 'custom_price' ? priceBasic : MIN_PRICES.basic,
        price_pro: pricingMode === 'custom_price' ? pricePro : MIN_PRICES.pro,
        price_pro_plus: pricingMode === 'custom_price' ? priceProPlus : MIN_PRICES.pro_plus,
        commission_percentage: pricingMode === 'commission' ? commissionPercentage : 0,
        referral_code: referralCode,
      });

      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setWhatsapp('');
      setAccessType('own_only');
      setPricingMode('commission');
      setPriceBasic(MIN_PRICES.basic);
      setPricePro(MIN_PRICES.pro);
      setPriceProPlus(MIN_PRICES.pro_plus);
      setCommissionPercentage(10);
      setReferralCode('');
      onOpenChange(false);
    } catch (err) {
      // Error handled by hook
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/cadastro?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Link copiado!',
      description: 'O link de indicação foi copiado.',
    });
  };

  const calculateExampleCommission = (price: number) => {
    return (price * commissionPercentage / 100).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Novo Revendedor
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure os dados e modo de operação do revendedor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome *</Label>
              <Input
                placeholder="Nome do revendedor"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Email *</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Senha *</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">WhatsApp (opcional)</Label>
              <Input
                type="tel"
                placeholder="(00) 00000-0000"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Access Type */}
          <div className="space-y-3">
            <Label className="text-slate-300">Tipo de Acesso</Label>
            <RadioGroup value={accessType} onValueChange={(v: any) => setAccessType(v)} className="space-y-2">
              <div className="flex items-start space-x-3 p-3 bg-slate-700/50 rounded-lg">
                <RadioGroupItem value="own_only" id="own_only" className="mt-0.5" />
                <div>
                  <Label htmlFor="own_only" className="text-white cursor-pointer">Apenas Próprios</Label>
                  <p className="text-xs text-slate-400">Vê apenas clientes que ele cadastrou ou indicou</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-slate-700/50 rounded-lg">
                <RadioGroupItem value="all" id="all" className="mt-0.5" />
                <div>
                  <Label htmlFor="all" className="text-white cursor-pointer">Acesso Total</Label>
                  <p className="text-xs text-slate-400">Vê todos os estabelecimentos do sistema</p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Pricing Mode */}
          <div className="space-y-3">
            <Label className="text-slate-300">Modo de Operação</Label>
            <RadioGroup value={pricingMode} onValueChange={(v: any) => setPricingMode(v)} className="space-y-2">
              <div className={`flex items-start space-x-3 p-3 rounded-lg border ${pricingMode === 'custom_price' ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-slate-700/50 border-slate-600'}`}>
                <RadioGroupItem value="custom_price" id="custom_price" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <Label htmlFor="custom_price" className="text-white cursor-pointer">Preço Próprio</Label>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Revendedor define seus preços (acima do seu custo).<br/>
                    Lucro = diferença entre o preço dele e o seu.
                  </p>
                </div>
              </div>
              <div className={`flex items-start space-x-3 p-3 rounded-lg border ${pricingMode === 'commission' ? 'bg-blue-900/30 border-blue-500/50' : 'bg-slate-700/50 border-slate-600'}`}>
                <RadioGroupItem value="commission" id="commission" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-blue-400" />
                    <Label htmlFor="commission" className="text-white cursor-pointer">Comissão</Label>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Revendedor usa seus preços fixos.<br/>
                    Você paga % sobre cada ativação de plano.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Prices - only if custom_price mode */}
          {pricingMode === 'custom_price' && (
            <div className="space-y-3 p-4 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
              <Label className="text-emerald-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Preços Personalizados
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Básico (mín. R$ {MIN_PRICES.basic})</Label>
                  <Input
                    type="number"
                    min={MIN_PRICES.basic}
                    step="0.01"
                    value={priceBasic}
                    onChange={(e) => setPriceBasic(Number(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Pro (mín. R$ {MIN_PRICES.pro})</Label>
                  <Input
                    type="number"
                    min={MIN_PRICES.pro}
                    step="0.01"
                    value={pricePro}
                    onChange={(e) => setPricePro(Number(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Pro+ (mín. R$ {MIN_PRICES.pro_plus})</Label>
                  <Input
                    type="number"
                    min={MIN_PRICES.pro_plus}
                    step="0.01"
                    value={priceProPlus}
                    onChange={(e) => setPriceProPlus(Number(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Se ele quiser cobrar mais, pode alterar. Nunca menos que isso.
              </p>
            </div>
          )}

          {/* Commission Settings - only if commission mode */}
          {pricingMode === 'commission' && (
            <div className="space-y-3 p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
              <Label className="text-blue-300 flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Porcentagem de Comissão
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={commissionPercentage}
                  onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white w-24"
                />
                <span className="text-white">%</span>
              </div>
              <div className="text-xs text-blue-300 space-y-1">
                <p>Exemplos de comissão por plano:</p>
                <p>• Básico (R$ {MIN_PRICES.basic}): <strong>R$ {calculateExampleCommission(MIN_PRICES.basic)}</strong></p>
                <p>• Pro (R$ {MIN_PRICES.pro}): <strong>R$ {calculateExampleCommission(MIN_PRICES.pro)}</strong></p>
                <p>• Pro+ (R$ {MIN_PRICES.pro_plus}): <strong>R$ {calculateExampleCommission(MIN_PRICES.pro_plus)}</strong></p>
              </div>
            </div>
          )}

          {/* Referral Link */}
          {referralCode && (
            <div className="space-y-2">
              <Label className="text-slate-300">Link de Indicação</Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/cadastro?ref=${referralCode}`}
                  readOnly
                  className="bg-slate-700 border-slate-600 text-slate-300 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyReferralLink}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Criar Revendedor
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
