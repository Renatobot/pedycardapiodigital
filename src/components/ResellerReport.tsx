import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  DollarSign,
  Percent,
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  BarChart3,
  Building2,
  Copy,
  Check,
} from 'lucide-react';
import { format, differenceInDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Reseller, ResellerStats, ResellerActivation } from '@/hooks/useResellers';

interface ResellerReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller: Reseller | null;
  stats: ResellerStats | null;
  loading: boolean;
  onMarkCommissionPaid: (activationIds: string[]) => Promise<void>;
  onRefreshStats: () => void;
}

export const ResellerReport = ({
  open,
  onOpenChange,
  reseller,
  stats,
  loading,
  onMarkCommissionPaid,
  onRefreshStats,
}: ResellerReportProps) => {
  const { toast } = useToast();
  const [markingPaid, setMarkingPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!reseller) return null;

  const getActivityStatus = () => {
    if (!reseller.last_activity_at) return { label: 'Nunca ativo', color: 'text-slate-400', bg: 'bg-slate-500/20' };
    
    const daysSinceActivity = differenceInDays(new Date(), new Date(reseller.last_activity_at));
    
    if (daysSinceActivity <= 7) {
      return { label: 'Ativo', color: 'text-green-400', bg: 'bg-green-500/20' };
    } else if (daysSinceActivity <= 30) {
      return { label: 'Pouco ativo', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    } else {
      return { label: 'Inativo', color: 'text-red-400', bg: 'bg-red-500/20' };
    }
  };

  const activityStatus = getActivityStatus();

  const handleMarkAllPaid = async () => {
    if (!stats) return;
    
    const pendingActivations = stats.activations.filter(a => a.commission_status === 'pending');
    if (pendingActivations.length === 0) {
      toast({
        title: 'Nenhuma comissão pendente',
        description: 'Todas as comissões já foram pagas.',
      });
      return;
    }

    setMarkingPaid(true);
    try {
      await onMarkCommissionPaid(pendingActivations.map(a => a.id));
      onRefreshStats();
    } catch (err) {
      // Error handled by hook
    }
    setMarkingPaid(false);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/cadastro?ref=${reseller.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Link copiado!',
      description: 'O link de indicação foi copiado.',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate metrics from stats
  const pendingCommission = stats?.pendingCommission || 0;
  const paidCommission = stats?.paidCommission || 0;
  const totalCommission = stats?.totalCommission || 0;
  const thisMonthActivations = stats?.thisMonthActivations || 0;
  const thisMonthCommission = stats?.thisMonthCommission || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Relatório: {reseller.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400 flex flex-wrap items-center gap-2">
            <span>{reseller.email}</span>
            {reseller.whatsapp && (
              <>
                <span>•</span>
                <span>{reseller.whatsapp}</span>
              </>
            )}
            <span>•</span>
            <span>Desde {format(new Date(reseller.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Status and Mode */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">Modo de Operação</p>
                <div className="flex items-center gap-2">
                  {reseller.pricing_mode === 'commission' ? (
                    <>
                      <Percent className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-blue-400">COMISSÃO ({reseller.commission_percentage}%)</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <span className="font-medium text-emerald-400">PREÇO PRÓPRIO</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">Status de Atividade</p>
                <div className="flex items-center gap-2">
                  <Badge className={`${activityStatus.bg} ${activityStatus.color}`}>
                    {activityStatus.label}
                  </Badge>
                  {reseller.last_activity_at && (
                    <span className="text-xs text-slate-500">
                      Último: {format(new Date(reseller.last_activity_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Referral Link */}
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Link de Indicação</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-blue-300 bg-slate-800 p-2 rounded truncate">
                  {window.location.origin}/cadastro?ref={reseller.referral_code}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyReferralLink}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Client Summary */}
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Resumo de Clientes
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{reseller.total_establishments}</p>
                  <p className="text-xs text-slate-400">Total Indicados</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{reseller.active_establishments}</p>
                  <p className="text-xs text-slate-400">Ativos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-400">
                    {reseller.total_establishments - reseller.active_establishments}
                  </p>
                  <p className="text-xs text-slate-400">Inativos</p>
                </div>
              </div>
              {reseller.total_establishments > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Taxa de Retenção</span>
                    <span>{((reseller.active_establishments / reseller.total_establishments) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress
                    value={(reseller.active_establishments / reseller.total_establishments) * 100}
                    className="h-2 bg-slate-600"
                  />
                </div>
              )}
            </div>

            {/* Commission Section - only for commission mode */}
            {reseller.pricing_mode === 'commission' && (
              <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                <h3 className="text-blue-300 font-medium mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Comissões ({reseller.commission_percentage}%)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xl font-bold text-blue-400">{thisMonthActivations}</p>
                    <p className="text-xs text-slate-400">Ativações (mês)</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xl font-bold text-blue-300">{formatCurrency(thisMonthCommission)}</p>
                    <p className="text-xs text-slate-400">Comissão (mês)</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-900/30 rounded-lg border border-yellow-500/30">
                    <p className="text-xl font-bold text-yellow-400">{formatCurrency(pendingCommission)}</p>
                    <p className="text-xs text-yellow-300">A Pagar</p>
                  </div>
                  <div className="text-center p-3 bg-green-900/30 rounded-lg border border-green-500/30">
                    <p className="text-xl font-bold text-green-400">{formatCurrency(paidCommission)}</p>
                    <p className="text-xs text-green-300">Já Pago</p>
                  </div>
                </div>

                {pendingCommission > 0 && (
                  <Button
                    onClick={handleMarkAllPaid}
                    disabled={markingPaid}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {markingPaid ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Marcar Comissões como Pagas ({formatCurrency(pendingCommission)})
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Price Settings - only for custom_price mode */}
            {reseller.pricing_mode === 'custom_price' && (
              <div className="p-4 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
                <h3 className="text-emerald-300 font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Preços do Revendedor
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-lg font-bold text-white">{formatCurrency(reseller.price_basic)}</p>
                    <p className="text-xs text-slate-400">Básico</p>
                    <p className="text-xs text-emerald-400">+{formatCurrency(reseller.price_basic - 37)}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-lg font-bold text-white">{formatCurrency(reseller.price_pro)}</p>
                    <p className="text-xs text-slate-400">Pro</p>
                    <p className="text-xs text-emerald-400">+{formatCurrency(reseller.price_pro - 59.90)}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-lg font-bold text-white">{formatCurrency(reseller.price_pro_plus)}</p>
                    <p className="text-xs text-slate-400">Pro+</p>
                    <p className="text-xs text-emerald-400">+{formatCurrency(reseller.price_pro_plus - 79.90)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activations */}
            {stats?.activations && stats.activations.length > 0 && reseller.pricing_mode === 'commission' && (
              <div className="space-y-3">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Histórico de Ativações
                </h3>
                <div className="rounded-lg border border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-700/50">
                        <TableHead className="text-slate-300">Estabelecimento</TableHead>
                        <TableHead className="text-slate-300">Data/Hora</TableHead>
                        <TableHead className="text-slate-300">Plano</TableHead>
                        <TableHead className="text-slate-300">Valor</TableHead>
                        <TableHead className="text-slate-300">Comissão</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.activations.slice(0, 10).map((activation) => (
                        <TableRow key={activation.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="text-white">{activation.establishment_name || '-'}</TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {format(new Date(activation.activated_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              activation.plan_type === 'pro_plus' ? 'bg-purple-500/20 text-purple-400' :
                              activation.plan_type === 'pro' ? 'bg-green-500/20 text-green-400' :
                              'bg-blue-500/20 text-blue-400'
                            }>
                              {activation.plan_type === 'pro_plus' ? 'Pro+' : activation.plan_type === 'pro' ? 'Pro' : 'Básico'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{formatCurrency(activation.plan_price)}</TableCell>
                          <TableCell className="text-blue-400 font-medium">{formatCurrency(activation.commission_value)}</TableCell>
                          <TableCell>
                            {activation.commission_status === 'paid' ? (
                              <Badge className="bg-green-500/20 text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Pago
                              </Badge>
                            ) : activation.commission_status === 'pending' ? (
                              <Badge className="bg-yellow-500/20 text-yellow-400">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendente
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400">
                                <XCircle className="w-3 h-3 mr-1" />
                                Cancelado
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Establishments List */}
            {stats?.establishments && stats.establishments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  Clientes Cadastrados
                </h3>
                <div className="rounded-lg border border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-700/50">
                        <TableHead className="text-slate-300">Estabelecimento</TableHead>
                        <TableHead className="text-slate-300">Data Cadastro</TableHead>
                        <TableHead className="text-slate-300">Plano</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Dias Rest.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.establishments.slice(0, 10).map((est: any) => {
                        const daysLeft = est.plan_status === 'trial' 
                          ? differenceInDays(new Date(est.trial_end_date), new Date())
                          : est.plan_expires_at 
                            ? differenceInDays(new Date(est.plan_expires_at), new Date())
                            : 0;
                        
                        return (
                          <TableRow key={est.id} className="border-slate-700 hover:bg-slate-700/50">
                            <TableCell className="text-white">{est.name}</TableCell>
                            <TableCell className="text-slate-300 text-sm">
                              {format(new Date(est.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                est.has_pro_plus ? 'bg-purple-500/20 text-purple-400' :
                                est.plan_status === 'active' ? 'bg-green-500/20 text-green-400' :
                                est.plan_status === 'trial' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-red-500/20 text-red-400'
                              }>
                                {est.has_pro_plus ? 'Pro+' : est.plan_status === 'active' ? 'Pro' : est.plan_status === 'trial' ? 'Trial' : 'Expirado'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {est.plan_status === 'expired' ? (
                                <XCircle className="w-4 h-4 text-red-400" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              )}
                            </TableCell>
                            <TableCell className={`${daysLeft <= 3 ? 'text-red-400' : 'text-slate-300'}`}>
                              {est.plan_status === 'expired' ? '-' : `${daysLeft} dias`}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
