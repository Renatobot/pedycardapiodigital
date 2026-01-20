import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Gift,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Wallet,
  Users,
  ArrowRight,
  Ticket,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdminStatsCard } from './AdminStatsCard';

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referred_name: string | null;
  plan_type: string;
  plan_value: number;
  credit_status: string;
  credit_applied_at: string | null;
  activated_at: string | null;
  created_at: string;
  referrer_name?: string;
  referrer_credit?: number;
}

interface EstablishmentInfo {
  id: string;
  name: string;
  referral_credit: number;
}

export function AdminReferralManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [establishments, setEstablishments] = useState<Map<string, EstablishmentInfo>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all referrals
      const { data: referralsData, error: refError } = await supabase
        .from('establishment_referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (refError) throw refError;

      // Fetch all establishments for name lookup
      const { data: estData, error: estError } = await supabase
        .from('establishments')
        .select('id, name, referral_credit');

      if (estError) throw estError;

      // Create a map for quick lookup
      const estMap = new Map<string, EstablishmentInfo>();
      (estData || []).forEach((est: any) => {
        estMap.set(est.id, {
          id: est.id,
          name: est.name,
          referral_credit: est.referral_credit || 0,
        });
      });

      setEstablishments(estMap);

      // Enrich referrals with referrer names
      const enrichedReferrals = (referralsData || []).map((ref: any) => ({
        ...ref,
        referrer_name: estMap.get(ref.referrer_id)?.name || 'Desconhecido',
        referrer_credit: estMap.get(ref.referrer_id)?.referral_credit || 0,
      }));

      setReferrals(enrichedReferrals);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de indicações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Statistics
  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.credit_status === 'pending').length,
    pendingValue: referrals
      .filter(r => r.credit_status === 'pending')
      .reduce((acc, r) => acc + Number(r.plan_value), 0),
    applied: referrals.filter(r => r.credit_status === 'applied').length,
    appliedValue: referrals
      .filter(r => r.credit_status === 'applied')
      .reduce((acc, r) => acc + Number(r.plan_value), 0),
    expired: referrals.filter(r => r.credit_status === 'expired').length,
    expiredValue: referrals
      .filter(r => r.credit_status === 'expired')
      .reduce((acc, r) => acc + Number(r.plan_value), 0),
  };

  // Filter referrals
  const filteredReferrals = referrals.filter(ref => {
    const matchesSearch = 
      (ref.referrer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (ref.referred_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && ref.credit_status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'applied':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aplicado
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            Expirado
          </Badge>
        );
      default:
        return null;
    }
  };

  const getPlanBadge = (planType: string) => {
    if (planType === 'pro_plus') {
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Pro+</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Pro</Badge>;
  };

  const handleApplyCredit = async () => {
    if (!selectedReferral) return;

    setActionLoading(true);
    try {
      // Update referral status
      const { error: refError } = await supabase
        .from('establishment_referrals')
        .update({
          credit_status: 'applied',
          credit_applied_at: new Date().toISOString(),
        })
        .eq('id', selectedReferral.id);

      if (refError) throw refError;

      // Update referrer's credit balance
      const currentCredit = establishments.get(selectedReferral.referrer_id)?.referral_credit || 0;
      const newCredit = currentCredit + Number(selectedReferral.plan_value);

      const { error: estError } = await supabase
        .from('establishments')
        .update({ referral_credit: newCredit })
        .eq('id', selectedReferral.referrer_id);

      if (estError) throw estError;

      toast({
        title: 'Crédito aplicado!',
        description: `R$ ${Number(selectedReferral.plan_value).toFixed(2).replace('.', ',')} adicionado ao saldo de ${selectedReferral.referrer_name}.`,
      });

      setApplyModalOpen(false);
      setSelectedReferral(null);
      await fetchData();
    } catch (error) {
      console.error('Error applying credit:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aplicar o crédito.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExpireCredit = async (referral: Referral) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('establishment_referrals')
        .update({ credit_status: 'expired' })
        .eq('id', referral.id);

      if (error) throw error;

      toast({
        title: 'Crédito expirado',
        description: `O crédito de ${referral.referrer_name} foi marcado como expirado.`,
      });

      await fetchData();
    } catch (error) {
      console.error('Error expiring credit:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível expirar o crédito.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner - Discount Type */}
      <Card className="bg-purple-500/10 border-purple-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
              <Ticket className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-300 flex items-center gap-2">
                🎫 INDICAÇÕES ENTRE LOJISTAS
              </h3>
              <p className="text-sm text-purple-200/80 mt-1">
                <strong>Ação:</strong> DAR DESCONTO NA PRÓXIMA MENSALIDADE
              </p>
              <p className="text-xs text-purple-200/60 mt-1">
                O valor é creditado como desconto na renovação do plano, <strong>NÃO é pago em dinheiro</strong>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminStatsCard
          icon={<Gift className="w-6 h-6" />}
          value={stats.total}
          label="Total Indicações"
          iconBgColor="bg-purple-500/20"
          iconColor="text-purple-400"
        />
        <AdminStatsCard
          icon={<Clock className="w-6 h-6" />}
          value={stats.pending}
          label={`Pendentes${stats.pendingValue > 0 ? ` (R$ ${stats.pendingValue.toFixed(2).replace('.', ',')})` : ''}`}
          iconBgColor="bg-yellow-500/20"
          iconColor="text-yellow-400"
        />
        <AdminStatsCard
          icon={<CheckCircle className="w-6 h-6" />}
          value={stats.applied}
          label={`Aplicados${stats.appliedValue > 0 ? ` (R$ ${stats.appliedValue.toFixed(2).replace('.', ',')})` : ''}`}
          iconBgColor="bg-green-500/20"
          iconColor="text-green-400"
        />
        <AdminStatsCard
          icon={<XCircle className="w-6 h-6" />}
          value={stats.expired}
          label="Expirados"
          iconBgColor="bg-red-500/20"
          iconColor="text-red-400"
        />
      </div>

      {/* Referrals Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-400" />
            Indicações de Lojistas (Crédito para Mensalidade)
          </CardTitle>
          <CardDescription className="text-slate-400">
            Gerencie os créditos de indicação - o valor vira desconto na próxima mensalidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all" className="text-white hover:bg-slate-600">Todos</SelectItem>
                <SelectItem value="pending" className="text-white hover:bg-slate-600">Pendentes</SelectItem>
                <SelectItem value="applied" className="text-white hover:bg-slate-600">Aplicados</SelectItem>
                <SelectItem value="expired" className="text-white hover:bg-slate-600">Expirados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">Indicador</TableHead>
                  <TableHead className="text-slate-300">Indicado</TableHead>
                  <TableHead className="text-slate-300">Plano</TableHead>
                  <TableHead className="text-slate-300">Valor</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Data</TableHead>
                  <TableHead className="text-slate-300 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                      {referrals.length === 0 
                        ? 'Nenhuma indicação registrada ainda'
                        : 'Nenhuma indicação encontrada com esses filtros'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReferrals.map((referral) => (
                    <TableRow 
                      key={referral.id} 
                      className={`border-slate-700 hover:bg-slate-700/50 ${
                        referral.credit_status === 'pending' ? 'border-l-2 border-l-yellow-500' :
                        referral.credit_status === 'applied' ? 'border-l-2 border-l-green-500' :
                        'border-l-2 border-l-red-500'
                      }`}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{referral.referrer_name}</p>
                          <p className="text-xs text-slate-400">
                            Saldo: R$ {(referral.referrer_credit || 0).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-slate-500" />
                          <span className="text-white">{referral.referred_name || 'Sem nome'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(referral.plan_type)}</TableCell>
                      <TableCell className="text-green-400 font-medium">
                        R$ {Number(referral.plan_value).toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell>{getStatusBadge(referral.credit_status)}</TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {referral.activated_at 
                          ? format(new Date(referral.activated_at), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {referral.credit_status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReferral(referral);
                                setApplyModalOpen(true);
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-xs"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              Dar Desconto
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExpireCredit(referral)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 text-xs"
                              disabled={actionLoading}
                            >
                              Expirar
                            </Button>
                          </div>
                        )}
                        {referral.credit_status === 'applied' && referral.credit_applied_at && (
                          <span className="text-xs text-slate-400">
                            Aplicado em {format(new Date(referral.credit_applied_at), 'dd/MM/yy', { locale: ptBR })}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Apply Credit Modal */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-400" />
              Dar Desconto na Mensalidade
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Confirme a aplicação do desconto para o indicador
            </DialogDescription>
          </DialogHeader>

          {selectedReferral && (
            <div className="space-y-4">
              {/* Warning Banner */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-sm text-purple-200">
                  Ao confirmar, o valor será adicionado como <strong>crédito para desconto</strong> na próxima mensalidade de <strong>{selectedReferral.referrer_name}</strong>. Este valor <strong>NÃO é pago em dinheiro</strong>.
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Indicador (receberá desconto):</span>
                  <span className="text-white font-medium">{selectedReferral.referrer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Indicado:</span>
                  <span className="text-white">{selectedReferral.referred_name || 'Sem nome'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Plano ativado:</span>
                  {getPlanBadge(selectedReferral.plan_type)}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valor do desconto:</span>
                  <span className="text-purple-400 font-bold text-lg">
                    R$ {Number(selectedReferral.plan_value).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="border-t border-slate-600 pt-3 flex justify-between">
                  <span className="text-slate-400">Saldo atual de desconto:</span>
                  <span className="text-white">
                    R$ {(selectedReferral.referrer_credit || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Novo saldo após aplicação:</span>
                  <span className="text-purple-400 font-bold">
                    R$ {((selectedReferral.referrer_credit || 0) + Number(selectedReferral.plan_value)).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApplyModalOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApplyCredit}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Tag className="w-4 h-4 mr-2" />
              )}
              Confirmar Desconto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
