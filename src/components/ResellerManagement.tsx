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
  Banknote,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useResellers, Reseller, ResellerStats } from '@/hooks/useResellers';
import { ResellerCreateModal } from '@/components/ResellerCreateModal';
import { ResellerReport } from '@/components/ResellerReport';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { AdminResellerCharts } from '@/components/AdminResellerCharts';
import { useIsMobile } from '@/hooks/use-mobile';

export const ResellerManagement = () => {
  const isMobile = useIsMobile();
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

  // Mobile Card Component
  const ResellerCard = ({ reseller }: { reseller: Reseller }) => {
    const activityStatus = getActivityStatus(reseller);
    
    return (
      <Card className={`bg-slate-700/50 border-slate-600 ${!reseller.is_active ? 'opacity-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white flex items-center gap-2 flex-wrap">
                <span className="truncate">{reseller.name}</span>
                {reseller.is_master && (
                  <Badge className="bg-red-500/20 text-red-400 text-xs shrink-0">Master</Badge>
                )}
                <span className={activityStatus.color}>{activityStatus.label}</span>
              </p>
              <p className="text-xs text-slate-400 truncate">{reseller.email}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleViewReport(reseller)}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 shrink-0"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4 mt-3 text-sm">
            {reseller.pricing_mode === 'commission' ? (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Banknote className="w-3 h-3 mr-1" />
                💵 Pagar {reseller.commission_percentage}%
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <DollarSign className="w-3 h-3 mr-1" />
                🏷️ Preço Próprio
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-600">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">
                👥 {reseller.total_establishments}
              </span>
              <span className="text-green-400">
                ✓ {reseller.active_establishments}
              </span>
              <span className="text-purple-400">
                ⚡ {reseller.total_activations}
              </span>
            </div>
            <Switch
              checked={reseller.is_active}
              onCheckedChange={() => handleToggleStatus(reseller)}
              disabled={togglingStatus === reseller.id || reseller.is_master}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Info Banner - Commission Type */}
      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0">
              <Banknote className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-300 flex items-center gap-2">
                💵 REVENDEDORES PARCEIROS
              </h3>
              <p className="text-sm text-green-200/80 mt-1">
                <strong>Ação:</strong> PAGAR COMISSÃO EM DINHEIRO (PIX/Transferência)
              </p>
              <p className="text-xs text-green-200/60 mt-1">
                As comissões devem ser pagas diretamente ao revendedor via transferência bancária.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            Revendedores (Pagar Comissão)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Gerencie os revendedores e pague comissões em dinheiro
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCharts(!showCharts)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1 sm:flex-none"
          >
            <ChartLine className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{showCharts ? 'Ocultar Gráficos' : 'Ver Gráficos'}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
          >
            <UserPlus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Novo Revendedor</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Revendedores</p>
                <p className="text-lg sm:text-2xl font-bold text-white">
                  <AnimatedCounter value={totalResellers} />
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Indicados</p>
                <p className="text-lg sm:text-2xl font-bold text-white">
                  <AnimatedCounter value={totalClients} />
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Ativos</p>
                <p className="text-lg sm:text-2xl font-bold text-green-400">
                  <AnimatedCounter value={activeClients} />
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Ativações</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-400">
                  <AnimatedCounter value={totalActivations} />
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <AdminResellerCharts resellers={resellers} />
      )}

      {/* Resellers List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-white text-base sm:text-lg">Lista de Revendedores</CardTitle>
          <CardDescription className="text-slate-400 text-xs sm:text-sm">
            Todos os revendedores cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
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
          ) : isMobile ? (
            // Mobile: Card Layout
            <div className="space-y-3">
              {resellers.map((reseller) => (
                <ResellerCard key={reseller.id} reseller={reseller} />
              ))}
            </div>
          ) : (
            // Desktop: Table Layout
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
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              <Banknote className="w-3 h-3 mr-1" />
                              💵 Pagar {reseller.commission_percentage}%
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                              <DollarSign className="w-3 h-3 mr-1" />
                              🏷️ Preço Próprio
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
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-400">
        <span>Legenda:</span>
        <span className="flex items-center gap-1">🟢 Ativo (7 dias)</span>
        <span className="flex items-center gap-1">🟡 Pouco ativo</span>
        <span className="flex items-center gap-1">🔴 Inativo</span>
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
