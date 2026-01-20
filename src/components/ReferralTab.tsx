import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Wallet,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { useEstablishmentReferrals } from '@/hooks/useEstablishmentReferrals';
import { formatCurrency } from '@/lib/whatsapp';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReferralTabProps {
  establishment: {
    id: string;
    name: string;
    logo_url?: string;
  };
}

export function ReferralTab({ establishment }: ReferralTabProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  
  const {
    loading,
    referralCode,
    referralCredit,
    referrals,
    getReferralLink,
    getWhatsAppShareMessage,
    getPendingCredit,
    getSuccessfulReferralsCount,
  } = useEstablishmentReferrals(establishment.id);

  const referralLink = getReferralLink();
  const pendingCredit = getPendingCredit();
  const successfulReferrals = getSuccessfulReferralsCount();

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus amigos empreendedores.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const message = getWhatsAppShareMessage(establishment.name);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Indique e Ganhe</CardTitle>
              <CardDescription>
                Ganhe crédito para sua próxima mensalidade
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Indique amigos empreendedores para o PEDY. Quando eles assinarem um plano <strong>Pro ou Pro+</strong>, 
            você ganha o valor do plano como crédito para usar na sua próxima renovação!
          </p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <Wallet className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(referralCredit)}</p>
              <p className="text-xs text-muted-foreground">Crédito Disponível</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-foreground">{formatCurrency(pendingCredit)}</p>
              <p className="text-xs text-muted-foreground">Pendente</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold text-foreground">{successfulReferrals}</p>
              <p className="text-xs text-muted-foreground">Indicações</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Compartilhe seu Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={referralLink} 
              readOnly 
              className="text-sm bg-muted"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={copyLink}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={shareWhatsApp}
            >
              <Share2 className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setQrModalOpen(true)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Compartilhe seu link</p>
                <p className="text-xs text-muted-foreground">Envie para amigos que têm negócios</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Eles se cadastram</p>
                <p className="text-xs text-muted-foreground">Teste grátis de 7 dias</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Assinam Pro ou Pro+</p>
                <p className="text-xs text-muted-foreground">R$ 59,90 ou R$ 79,90</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600">Você ganha crédito!</p>
                <p className="text-xs text-muted-foreground">Valor do plano na sua próxima mensalidade</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referrals History */}
      {referrals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Suas Indicações ({referrals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referrals.map((referral) => (
                <div 
                  key={referral.id} 
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">{referral.referred_name || 'Estabelecimento'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {referral.plan_type === 'pro_plus' ? 'Pro+' : 'Pro'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(referral.plan_value)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {referral.credit_status === 'pending' ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Pendente
                      </Badge>
                    ) : referral.credit_status === 'applied' ? (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Aplicado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Expirado
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {referrals.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Você ainda não tem indicações.<br />
              Compartilhe seu link e comece a ganhar!
            </p>
          </CardContent>
        </Card>
      )}

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">QR Code de Indicação</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeCanvas
                value={referralLink}
                size={200}
                level="H"
                includeMargin={true}
                imageSettings={establishment.logo_url ? {
                  src: establishment.logo_url,
                  height: 50,
                  width: 50,
                  excavate: true,
                } : undefined}
              />
            </div>
            <div className="text-center">
              <p className="font-semibold">{establishment.name}</p>
              <p className="text-xs text-muted-foreground">Escaneie para se cadastrar</p>
            </div>
            <Button className="w-full" onClick={copyLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
