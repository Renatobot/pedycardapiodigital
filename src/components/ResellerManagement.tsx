import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  UserPlus,
  DollarSign,
  Percent,
  BarChart3,
  Loader2,
  Building2,
  TrendingUp,
  Eye,
  ChartLine,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useResellers, Reseller, ResellerStats } from '@/hooks/useResellers';
import { ResellerCreateModal } from '@/components/ResellerCreateModal';
import { ResellerReport } from '@/components/ResellerReport';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { AdminResellerCharts } from '@/components/AdminResellerCharts';

export const ResellerManagement = () => {
  const {
    resellers,
    loading,
    fetchResellers,
    createReseller,
    getResellerStats,
    markCommissionPaid,
    toggleResellerStatus,
  } = useResellers();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReseller, setSelectedReseller] = useState<Reseller | null>(null);
  const [selectedStats, setSelectedStats] = useState<ResellerStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    fetchResellers();
  }, [fetchResellers]);

  const handleViewReport = async (reseller: Reseller) => {
    setSelectedReseller(reseller);
    setReportModalOpen(true);
    setLoadingStats(true);
    
    const stats = await getResellerStats(reseller.id);
    setSelectedStats(stats);
    setLoadingStats(false);
  };

  const handleRefreshStats = async () => {
    if (selectedReseller) {
      setLoadingStats(true);
      const stats = await getResellerStats(selectedReseller.id);
      setSelectedStats(stats);
      setLoadingStats(false);
    }
  };

  const handleToggleStatus = async (reseller: Reseller) => {
    setTogglingStatus(reseller.id);
    try {
      await toggleResellerStatus(reseller.id, !reseller.is_active);
    } catch (err) {
      // Error handled by hook
    }
    setTogglingStatus(null);
  };

  const getActivityStatus = (reseller: Reseller) => {
    if (!reseller.last_activity_at) return { label: '🔴', color: 'text-slate-400' };
    
    const daysSinceActivity = differenceInDays(new Date(), new Date(reseller.last_activity_at));
    
    if (daysSinceActivity <= 7) {
      return { label: '🟢', color: 'text-green-400' };
    } else if (daysSinceActivity <= 30) {
      return { label: '🟡', color: 'text-yellow-400' };
    } else {
      return { label: '🔴', color: 'text-red-400' };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate totals
  const totalResellers = resellers.length;
  const totalClients = resellers.reduce((sum, r) => sum + r.total_establishments, 0);
  const activeClients = resellers.reduce((sum, r) => sum + r.active_establishments, 0);
  const totalActivations = resellers.reduce((sum, r) => sum + r.total_activations, 0);

  // Calculate pending commissions (approximate - would need to query activations)
  const commissionResellers = resellers.filter(r => r.pricing_mode === 'commission');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Revendedores
          </h2>
          <p className="text-sm text-slate-400">
            Gerencie os revendedores e acompanhe suas vendas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCharts(!showCharts)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <ChartLine className="w-4 h-4 mr-2" />
            {showCharts ? 'Ocultar Gráficos' : 'Ver Gráficos'}
          </Button>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Revendedor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Revendedores</p>
                <p className="text-2xl font-bold text-white">
                  <AnimatedCounter value={totalResellers} />
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Clientes Indicados</p>
                <p className="text-2xl font-bold text-white">
                  <AnimatedCounter value={totalClients} />
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Clientes Ativos</p>
                <p className="text-2xl font-bold text-green-400">
                  <AnimatedCounter value={activeClients} />
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Ativações</p>
                <p className="text-2xl font-bold text-purple-400">
                  <AnimatedCounter value={totalActivations} />
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <AdminResellerCharts resellers={resellers} />
      )}

      {/* Resellers Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Revendedores</CardTitle>
          <CardDescription className="text-slate-400">
            Todos os revendedores cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : resellers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nenhum revendedor cadastrado</p>
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 bg-green-600 hover:bg-green-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Revendedor
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300">Nome</TableHead>
                    <TableHead className="text-slate-300">Modo</TableHead>
                    <TableHead className="text-slate-300">Clientes</TableHead>
                    <TableHead className="text-slate-300">Ativos</TableHead>
                    <TableHead className="text-slate-300">Ativações</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Ativo</TableHead>
                    <TableHead className="text-slate-300 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resellers.map((reseller) => {
                    const activityStatus = getActivityStatus(reseller);
                    
                    return (
                      <TableRow 
                        key={reseller.id} 
                        className={`border-slate-700 hover:bg-slate-700/50 ${!reseller.is_active ? 'opacity-50' : ''}`}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-white flex items-center gap-2">
                              {reseller.name}
                              {reseller.is_master && (
                                <Badge className="bg-red-500/20 text-red-400 text-xs">Master</Badge>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{reseller.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {reseller.pricing_mode === 'commission' ? (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              <Percent className="w-3 h-3 mr-1" />
                              {reseller.commission_percentage}%
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <DollarSign className="w-3 h-3 mr-1" />
                              Preço
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-white">{reseller.total_establishments}</TableCell>
                        <TableCell className="text-green-400">{reseller.active_establishments}</TableCell>
                        <TableCell className="text-purple-400">{reseller.total_activations}</TableCell>
                        <TableCell>
                          <span className={activityStatus.color}>{activityStatus.label}</span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={reseller.is_active}
                            onCheckedChange={() => handleToggleStatus(reseller)}
                            disabled={togglingStatus === reseller.id || reseller.is_master}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewReport(reseller)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>Legenda:</span>
        <span className="flex items-center gap-1">🟢 Ativo (últimos 7 dias)</span>
        <span className="flex items-center gap-1">🟡 Pouco ativo (7-30 dias)</span>
        <span className="flex items-center gap-1">🔴 Inativo (30+ dias)</span>
      </div>

      {/* Create Modal */}
      <ResellerCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={createReseller}
        loading={loading}
      />

      {/* Report Modal */}
      <ResellerReport
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        reseller={selectedReseller}
        stats={selectedStats}
        loading={loadingStats}
        onMarkCommissionPaid={markCommissionPaid}
        onRefreshStats={handleRefreshStats}
      />
    </div>
  );
};
