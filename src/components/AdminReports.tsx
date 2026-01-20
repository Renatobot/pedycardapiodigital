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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Relatórios e Métricas
          </h2>
          <p className="text-sm text-slate-400">
            {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Métricas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 border-emerald-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-300/80">MRR Estimado</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(metrics.estimatedMRR)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {metrics.actives} estabelecimentos ativos
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-300/80">Receita Potencial</p>
                <p className="text-2xl font-bold text-blue-400">
                  {formatCurrency(metrics.potentialMRR)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  se todos convertessem
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300/80">Receita Pro+</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatCurrency(metrics.proUpgradeRevenue)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  receita extra/mês
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-300/80">Perda por Churn</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(metrics.churnLoss)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {metrics.expired} expirados
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversão Trial → Pro */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Conversão Trial → Pro
          </CardTitle>
          <CardDescription className="text-slate-400">
            Acompanhamento do funil de conversão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Funil Visual */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-3xl font-bold text-blue-400">
                <AnimatedCounter value={metrics.total} />
              </div>
              <p className="text-sm text-slate-400 mt-1">Total Cadastros</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/50 rounded-lg relative">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block">
                <ArrowUpRight className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-3xl font-bold text-cyan-400">
                <AnimatedCounter value={metrics.activeTrials} />
              </div>
              <p className="text-sm text-slate-400 mt-1">Em Trial</p>
            </div>

            <div className="text-center p-4 bg-slate-700/50 rounded-lg relative">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block">
                <ArrowUpRight className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                <AnimatedCounter value={metrics.expiredTrials} />
              </div>
              <p className="text-sm text-slate-400 mt-1">Trials Finalizados</p>
            </div>

            <div className="text-center p-4 bg-green-900/30 rounded-lg border border-green-700/50 relative">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-green-400">
                <AnimatedCounter value={metrics.convertedFromTrial} />
              </div>
              <p className="text-sm text-green-300 mt-1">Converteram</p>
            </div>

            <div className="text-center p-4 bg-red-900/30 rounded-lg border border-red-700/50 relative">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 hidden md:block">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-3xl font-bold text-red-400">
                <AnimatedCounter value={metrics.churnedTrials} />
              </div>
              <p className="text-sm text-red-300 mt-1">Não Converteram</p>
            </div>
          </div>

          {/* Taxas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Taxa de Conversão</span>
                  <Badge className={metrics.conversionRate >= 30 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    {metrics.conversionRate.toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={metrics.conversionRate} 
                  className="h-2 bg-slate-600"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Meta: 30% • {metrics.conversionRate >= 30 ? '✓ Atingida' : `Falta ${(30 - metrics.conversionRate).toFixed(0)}%`}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Taxa de Churn</span>
                  <Badge className={metrics.churnRate <= 50 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    {metrics.churnRate.toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={metrics.churnRate} 
                  className="h-2 bg-slate-600"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Meta: {"<"}50% • {metrics.churnRate <= 50 ? '✓ Dentro da meta' : 'Acima da meta'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">Taxa de Retenção</span>
                  <Badge className={metrics.retentionRate >= 70 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    {metrics.retentionRate.toFixed(1)}%
                  </Badge>
                </div>
                <Progress 
                  value={metrics.retentionRate} 
                  className="h-2 bg-slate-600"
                />
                <p className="text-xs text-slate-500 mt-2">
                  {metrics.retainedOver30Days} ativos há mais de 30 dias
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alertas */}
          {metrics.expiringTrials > 0 && (
            <div className="p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-sm text-amber-200 font-medium">
                    {metrics.expiringTrials} trial{metrics.expiringTrials > 1 ? 's' : ''} expirando nos próximos 3 dias
                  </p>
                  <p className="text-xs text-amber-300/70">
                    Entre em contato para incentivar a conversão
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crescimento e Distribuição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crescimento */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Crescimento de Cadastros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-sm text-slate-400">Cadastros este mês</p>
                <p className="text-2xl font-bold text-white">{metrics.registrationsThisMonth}</p>
              </div>
              <div className={`flex items-center gap-1 ${metrics.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.growthRate >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="font-medium">{Math.abs(metrics.growthRate).toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-sm text-slate-400">Últimos 30 dias</p>
                <p className="text-2xl font-bold text-white">{metrics.registrationsLast30Days}</p>
              </div>
              <Badge className="bg-slate-600 text-slate-300">
                vs período anterior
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Plano */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              Distribuição por Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-300">Trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{metrics.planDistribution.trial.count}</span>
                  <span className="text-xs text-slate-500">({metrics.planDistribution.trial.percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <Progress value={metrics.planDistribution.trial.percentage} className="h-2 bg-slate-700" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-slate-300">Pro</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{metrics.planDistribution.active.count}</span>
                  <span className="text-xs text-slate-500">({metrics.planDistribution.active.percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <Progress value={metrics.planDistribution.active.percentage} className="h-2 bg-slate-700" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm text-slate-300">Pro+</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{metrics.planDistribution.proPlus.count}</span>
                  <span className="text-xs text-slate-500">({metrics.planDistribution.proPlus.percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <Progress value={metrics.planDistribution.proPlus.percentage} className="h-2 bg-slate-700" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-slate-300">Expirado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{metrics.planDistribution.expired.count}</span>
                  <span className="text-xs text-slate-500">({metrics.planDistribution.expired.percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <Progress value={metrics.planDistribution.expired.percentage} className="h-2 bg-slate-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Rápido */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Resumo Executivo</h3>
              <p className="text-xs text-slate-400">Principais indicadores do período</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(metrics.estimatedMRR)}</p>
              <p className="text-xs text-slate-400">MRR Atual</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-400">{metrics.conversionRate.toFixed(1)}%</p>
              <p className="text-xs text-slate-400">Conversão</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">{metrics.proPlus}</p>
              <p className="text-xs text-slate-400">Pro+</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{metrics.activeTrials}</p>
              <p className="text-xs text-slate-400">Em Trial</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
