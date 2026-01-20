import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, RefreshCw, Calendar } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Establishment {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  cpf_cnpj: string;
  plan_status: string;
  plan_expires_at: string | null;
  trial_end_date: string;
  has_pro_plus: boolean;
}

interface AdminQuickActionsProps {
  establishments: Establishment[];
  onRefresh: () => Promise<void>;
  lastUpdate: Date | null;
}

export function AdminQuickActions({ establishments, onRefresh, lastUpdate }: AdminQuickActionsProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate trials expiring soon (within 3 days)
  const expiringTrials = establishments.filter(est => {
    if (est.plan_status !== 'trial') return false;
    const daysLeft = differenceInDays(new Date(est.trial_end_date), new Date());
    return daysLeft >= 0 && daysLeft <= 3;
  });

  // Calculate active plans expiring soon (within 7 days)
  const expiringPlans = establishments.filter(est => {
    if (est.plan_status !== 'active' || !est.plan_expires_at) return false;
    const daysLeft = differenceInDays(new Date(est.plan_expires_at), new Date());
    return daysLeft >= 0 && daysLeft <= 7;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: 'Dados atualizados!',
        description: 'Lista de estabelecimentos atualizada com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar os dados.',
        variant: 'destructive',
      });
    }
    setIsRefreshing(false);
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'WhatsApp', 'CPF/CNPJ', 'Status', 'Pro+', 'Expiração'];
    const rows = establishments.map(est => [
      est.name,
      est.email,
      est.whatsapp,
      est.cpf_cnpj,
      est.plan_status,
      est.has_pro_plus ? 'Sim' : 'Não',
      est.plan_status === 'trial' 
        ? est.trial_end_date 
        : est.plan_expires_at || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `estabelecimentos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Exportação concluída!',
      description: `${establishments.length} estabelecimentos exportados.`,
    });
  };

  const totalAlerts = expiringTrials.length + expiringPlans.length;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Alerts Section */}
        <div className="flex flex-wrap items-center gap-3">
          {expiringTrials.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-300">
                <strong>{expiringTrials.length}</strong> {expiringTrials.length === 1 ? 'trial expira' : 'trials expiram'} em até 3 dias
              </span>
            </div>
          )}
          
          {expiringPlans.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300">
                <strong>{expiringPlans.length}</strong> {expiringPlans.length === 1 ? 'plano vence' : 'planos vencem'} em até 7 dias
              </span>
            </div>
          )}

          {totalAlerts === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <span className="text-sm text-green-300">
                ✓ Nenhum alerta no momento
              </span>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-slate-500">
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
