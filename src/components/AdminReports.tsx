import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  BarChart3,
  PieChart,
  Calendar,
} from 'lucide-react';
import { format, differenceInDays, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatedCounter } from '@/components/AnimatedCounter';

interface Establishment {
  id: string;
  name: string;
  email: string;
  plan_status: string;
  plan_expires_at: string | null;
  trial_start_date: string;
  trial_end_date: string;
  created_at: string;
  has_pro_plus: boolean;
  pro_plus_activated_at: string | null;
}

interface AdminReportsProps {
  establishments: Establishment[];
}

// Valores dos planos (em R$)
const PLAN_PRICES = {
  basico: 37,
  pro: 57,
  pro_plus: 77,
};

export const AdminReports = ({ establishments }: AdminReportsProps) => {
  const metrics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    // Contagens básicas
    const total = establishments.length;
    const trials = establishments.filter(e => e.plan_status === 'trial');
    const actives = establishments.filter(e => e.plan_status === 'active');
    const expired = establishments.filter(e => e.plan_status === 'expired');
    const proPlus = establishments.filter(e => e.has_pro_plus);

    // Cadastros no mês atual
    const registrationsThisMonth = establishments.filter(e => {
      const createdAt = new Date(e.created_at);
      return isWithinInterval(createdAt, { start: currentMonthStart, end: currentMonthEnd });
    }).length;

    // Cadastros últimos 30 dias vs 30-60 dias
    const registrationsLast30Days = establishments.filter(e => {
      const createdAt = new Date(e.created_at);
      return createdAt >= thirtyDaysAgo;
    }).length;

    const registrations30to60Days = establishments.filter(e => {
      const createdAt = new Date(e.created_at);
      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;

    // Taxa de crescimento de cadastros
    const growthRate = registrations30to60Days > 0 
      ? ((registrationsLast30Days - registrations30to60Days) / registrations30to60Days * 100)
      : registrationsLast30Days > 0 ? 100 : 0;

    // ========================================
    // CONVERSÃO TRIAL → PRO (DETALHADA)
    // ========================================

    // Trials que já expiraram (não estão mais em trial)
    const expiredTrials = establishments.filter(e => {
      const trialEnd = new Date(e.trial_end_date);
      return trialEnd < now && e.plan_status !== 'trial';
    });

    // Desses, quantos converteram para ativo/pro
    const convertedFromTrial = expiredTrials.filter(e => 
      e.plan_status === 'active' || e.has_pro_plus
    );

    // Taxa de conversão
    const conversionRate = expiredTrials.length > 0 
      ? (convertedFromTrial.length / expiredTrials.length * 100)
      : 0;

    // Trials ativos
    const activeTrials = trials.length;

    // Trials que expiraram e não converteram (churn)
    const churnedTrials = expiredTrials.filter(e => 
      e.plan_status === 'expired'
    );

    const churnRate = expiredTrials.length > 0 
      ? (churnedTrials.length / expiredTrials.length * 100)
      : 0;

    // Trials próximos de expirar (próximos 3 dias)
    const expiringTrials = trials.filter(e => {
      const daysLeft = differenceInDays(new Date(e.trial_end_date), now);
      return daysLeft >= 0 && daysLeft <= 3;
    });

    // ========================================
    // MÉTRICAS FINANCEIRAS
    // ========================================

    // Receita estimada mensal (MRR)
    const activePro = actives.filter(e => !e.has_pro_plus).length;
    const activeProPlus = proPlus.filter(e => e.plan_status === 'active').length;

    const estimatedMRR = (activePro * PLAN_PRICES.pro) + (activeProPlus * PLAN_PRICES.pro_plus);

    // Receita potencial se todos convertessem
    const potentialMRR = total * PLAN_PRICES.pro;

    // Perda por churn (estabelecimentos expirados)
    const churnLoss = expired.length * PLAN_PRICES.pro;

    // Receita por upgrade Pro+
    const proUpgradeRevenue = activeProPlus * (PLAN_PRICES.pro_plus - PLAN_PRICES.pro);

    // ========================================
    // MÉTRICAS DE RETENÇÃO
    // ========================================

    // Estabelecimentos ativos há mais de 30 dias
    const retainedOver30Days = actives.filter(e => {
      const createdAt = new Date(e.created_at);
      return differenceInDays(now, createdAt) > 30;
    });

    const retentionRate = actives.length > 0 
      ? (retainedOver30Days.length / actives.length * 100)
      : 0;

    // ========================================
    // DISTRIBUIÇÃO POR PLANO
    // ========================================
    const planDistribution = {
      trial: { count: trials.length, percentage: total > 0 ? (trials.length / total * 100) : 0 },
      active: { count: activePro, percentage: total > 0 ? (activePro / total * 100) : 0 },
      proPlus: { count: activeProPlus, percentage: total > 0 ? (activeProPlus / total * 100) : 0 },
      expired: { count: expired.length, percentage: total > 0 ? (expired.length / total * 100) : 0 },
    };

    return {
      total,
      trials: trials.length,
      actives: actives.length,
      expired: expired.length,
      proPlus: proPlus.length,
      registrationsThisMonth,
      registrationsLast30Days,
      growthRate,
      conversionRate,
      convertedFromTrial: convertedFromTrial.length,
      expiredTrials: expiredTrials.length,
      activeTrials,
      churnedTrials: churnedTrials.length,
      churnRate,
      expiringTrials: expiringTrials.length,
      estimatedMRR,
      potentialMRR,
      churnLoss,
      proUpgradeRevenue,
      retentionRate,
      retainedOver30Days: retainedOver30Days.length,
      planDistribution,
    };
  }, [establishments]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
            Relatórios e Métricas
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Métricas Financeiras */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border-emerald-700/50">
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-emerald-300/80 truncate">MRR</p>
                <p className="text-lg md:text-2xl font-bold text-emerald-400 truncate">
                  {formatCurrency(metrics.estimatedMRR)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 md:mt-1 hidden sm:block">
                  {metrics.actives} ativos
                </p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-emerald-500/20 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 self-end md:self-auto">
                <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50">
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-blue-300/80 truncate">Potencial</p>
                <p className="text-lg md:text-2xl font-bold text-blue-400 truncate">
                  {formatCurrency(metrics.potentialMRR)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 md:mt-1 hidden sm:block">
                  se todos convertessem
                </p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-500/20 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 self-end md:self-auto">
                <Target className="w-4 h-4 md:w-6 md:h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50">
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-purple-300/80 truncate">Pro+</p>
                <p className="text-lg md:text-2xl font-bold text-purple-400 truncate">
                  {formatCurrency(metrics.proUpgradeRevenue)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 md:mt-1 hidden sm:block">
                  receita extra/mês
                </p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-500/20 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 self-end md:self-auto">
                <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700/50">
          <CardContent className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-red-300/80 truncate">Churn</p>
                <p className="text-lg md:text-2xl font-bold text-red-400 truncate">
                  {formatCurrency(metrics.churnLoss)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 md:mt-1 hidden sm:block">
                  {metrics.expired} expirados
                </p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 bg-red-500/20 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 self-end md:self-auto">
                <TrendingDown className="w-4 h-4 md:w-6 md:h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversão Trial → Pro */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
          <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
            Conversão Trial → Pro
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs md:text-sm">
            Funil de conversão
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4 md:space-y-6">
          {/* Funil Visual */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
            <div className="text-center p-2 md:p-4 bg-slate-700/50 rounded-lg">
              <div className="text-xl md:text-3xl font-bold text-blue-400">
                <AnimatedCounter value={metrics.total} />
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5 md:mt-1">Cadastros</p>
            </div>
            
            <div className="text-center p-2 md:p-4 bg-slate-700/50 rounded-lg relative">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block">
                <ArrowUpRight className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-cyan-400">
                <AnimatedCounter value={metrics.activeTrials} />
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5 md:mt-1">Em Trial</p>
            </div>

            <div className="text-center p-2 md:p-4 bg-slate-700/50 rounded-lg relative">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block">
                <ArrowUpRight className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-yellow-400">
                <AnimatedCounter value={metrics.expiredTrials} />
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5 md:mt-1">Finalizados</p>
            </div>

            <div className="text-center p-2 md:p-4 bg-green-900/30 rounded-lg border border-green-700/50 relative">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-green-400">
                <AnimatedCounter value={metrics.convertedFromTrial} />
              </div>
              <p className="text-xs md:text-sm text-green-300 mt-0.5 md:mt-1">Converteram</p>
            </div>

            <div className="text-center p-2 md:p-4 bg-red-900/30 rounded-lg border border-red-700/50 relative col-span-2 sm:col-span-1">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-xl md:text-3xl font-bold text-red-400">
                <AnimatedCounter value={metrics.churnedTrials} />
              </div>
              <p className="text-xs md:text-sm text-red-300 mt-0.5 md:mt-1">Não Converteram</p>
            </div>
          </div>

          {/* Taxas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <span className="text-xs md:text-sm text-slate-300">Conversão</span>
                  <Badge className={`text-xs ${metrics.conversionRate >= 30 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {metrics.conversionRate.toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={metrics.conversionRate} 
                  className="h-1.5 md:h-2 bg-slate-600"
                />
                <p className="text-xs text-slate-500 mt-1 md:mt-2 hidden sm:block">
                  Meta: 30% • {metrics.conversionRate >= 30 ? '✓' : `Falta ${(30 - metrics.conversionRate).toFixed(0)}%`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <span className="text-xs md:text-sm text-slate-300">Churn</span>
                  <Badge className={`text-xs ${metrics.churnRate <= 50 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {metrics.churnRate.toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={metrics.churnRate} 
                  className="h-1.5 md:h-2 bg-slate-600"
                />
                <p className="text-xs text-slate-500 mt-1 md:mt-2 hidden sm:block">
                  Meta: {"<"}50% • {metrics.churnRate <= 50 ? '✓' : 'Acima'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between mb-1.5 md:mb-2">
                  <span className="text-xs md:text-sm text-slate-300">Retenção</span>
                  <Badge className={`text-xs ${metrics.retentionRate >= 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {metrics.retentionRate.toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={metrics.retentionRate} 
                  className="h-1.5 md:h-2 bg-slate-600"
                />
                <p className="text-xs text-slate-500 mt-1 md:mt-2 hidden sm:block">
                  {metrics.retainedOver30Days} há +30 dias
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alertas */}
          {metrics.expiringTrials > 0 && (
            <div className="p-3 md:p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg">
              <div className="flex items-start md:items-center gap-2 md:gap-3">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-400 shrink-0 mt-0.5 md:mt-0" />
                <div>
                  <p className="text-xs md:text-sm text-amber-200 font-medium">
                    {metrics.expiringTrials} trial{metrics.expiringTrials > 1 ? 's' : ''} expirando em 3 dias
                  </p>
                  <p className="text-xs text-amber-300/70 hidden md:block">
                    Entre em contato para incentivar a conversão
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crescimento e Distribuição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Crescimento */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
              Crescimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between p-3 md:p-4 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-xs md:text-sm text-slate-400">Este mês</p>
                <p className="text-xl md:text-2xl font-bold text-white">{metrics.registrationsThisMonth}</p>
              </div>
              <div className={`flex items-center gap-1 ${metrics.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.growthRate >= 0 ? (
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />
                )}
                <span className="text-sm md:text-base font-medium">{Math.abs(metrics.growthRate).toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 md:p-4 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-xs md:text-sm text-slate-400">30 dias</p>
                <p className="text-xl md:text-2xl font-bold text-white">{metrics.registrationsLast30Days}</p>
              </div>
              <Badge className="bg-slate-600 text-slate-300 text-xs">
                vs anterior
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Plano */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
              <PieChart className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
              Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500" />
                  <span className="text-xs md:text-sm text-slate-300">Trial</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="text-white font-medium text-sm">{metrics.planDistribution.trial.count}</span>
                  <span className="text-xs text-slate-500">({metrics.planDistribution.trial.percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <Progress value={metrics.planDistribution.trial.percentage} className="h-1.5 md:h-2 bg-slate-700" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500" />
                  <span className="text-xs md:text-sm text-slate-300">Pro</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="text-white font-medium text-sm">{metrics.planDistribution.active.count}</span>
                  <span className="text-xs text-slate-500">({metrics.planDistribution.active.percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <Progress value={metrics.planDistribution.active.percentage} className="h-1.5 md:h-2 bg-slate-700" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-purple-500" />
                  <span className="text-xs md:text-sm text-slate-300">Pro+</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="text-white font-medium text-sm">{metrics.planDistribution.proPlus.count}</span>
                  <span className="text-xs text-slate-500">({metrics.planDistribution.proPlus.percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <Progress value={metrics.planDistribution.proPlus.percentage} className="h-1.5 md:h-2 bg-slate-700" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500" />
                  <span className="text-xs md:text-sm text-slate-300">Expirado</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="text-white font-medium text-sm">{metrics.planDistribution.expired.count}</span>
                  <span className="text-xs text-slate-500">({metrics.planDistribution.expired.percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <Progress value={metrics.planDistribution.expired.percentage} className="h-1.5 md:h-2 bg-slate-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Rápido */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-800/50 border-slate-700">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm md:text-base">Resumo</h3>
              <p className="text-xs text-slate-400 hidden md:block">Indicadores do período</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-center">
            <div className="p-2 md:p-0">
              <p className="text-lg md:text-2xl font-bold text-emerald-400 truncate">{formatCurrency(metrics.estimatedMRR)}</p>
              <p className="text-xs text-slate-400">MRR</p>
            </div>
            <div className="p-2 md:p-0">
              <p className="text-lg md:text-2xl font-bold text-blue-400">{metrics.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-slate-400">Conversão</p>
            </div>
            <div className="p-2 md:p-0">
              <p className="text-lg md:text-2xl font-bold text-purple-400">{metrics.proPlus}</p>
              <p className="text-xs text-slate-400">Pro+</p>
            </div>
            <div className="p-2 md:p-0">
              <p className="text-lg md:text-2xl font-bold text-yellow-400">{metrics.activeTrials}</p>
              <p className="text-xs text-slate-400">Trial</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
