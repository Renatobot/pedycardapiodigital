import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { useMemo, useState, useEffect } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Reseller {
  id: string;
  name: string;
  pricing_mode: string;
  commission_percentage: number;
  total_establishments: number;
  active_establishments: number;
  total_activations: number;
}

interface ResellerActivation {
  id: string;
  reseller_id: string;
  activated_at: string;
  commission_status: string;
  commission_value: number;
  plan_type: string;
}

interface AdminResellerChartsProps {
  resellers: Reseller[];
}

export function AdminResellerCharts({ resellers }: AdminResellerChartsProps) {
  const [activations, setActivations] = useState<ResellerActivation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('reseller_activations')
          .select('id, reseller_id, activated_at, commission_status, commission_value, plan_type')
          .order('activated_at', { ascending: false });

        if (error) throw error;
        setActivations(data || []);
      } catch (error) {
        console.error('Erro ao buscar ativações:', error);
      }
      setLoading(false);
    };

    fetchActivations();
  }, []);

  // Chart 1: Clients per reseller (bar chart)
  const clientsPerReseller = useMemo(() => {
    return resellers
      .filter(r => r.total_establishments > 0)
      .sort((a, b) => b.total_establishments - a.total_establishments)
      .slice(0, 10)
      .map(r => ({
        name: r.name.length > 10 ? r.name.substring(0, 10) + '...' : r.name,
        fullName: r.name,
        ativos: r.active_establishments,
        inativos: r.total_establishments - r.active_establishments,
      }));
  }, [resellers]);

  // Chart 2: Activations over time (last 30 days)
  const activationsOverTime = useMemo(() => {
    const days = 14;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const nextDate = startOfDay(subDays(new Date(), i - 1));
      
      const count = activations.filter(act => {
        if (!act.activated_at) return false;
        const activatedAt = new Date(act.activated_at);
        return activatedAt >= date && activatedAt < nextDate;
      }).length;
      
      data.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        ativações: count,
      });
    }
    
    return data;
  }, [activations]);

  // Chart 3: Distribution by pricing mode (pie chart)
  const pricingModeDistribution = useMemo(() => {
    const commission = resellers.filter(r => r.pricing_mode === 'commission').length;
    const custom = resellers.filter(r => r.pricing_mode === 'custom_price').length;

    return [
      { name: 'Comissão', value: commission, color: '#3B82F6' },
      { name: 'Preço Próprio', value: custom, color: '#22C55E' },
    ].filter(item => item.value > 0);
  }, [resellers]);

  // Chart 4: Commissions by reseller (pending vs paid)
  const commissionsPerReseller = useMemo(() => {
    const resellerCommissions: Record<string, { name: string; pendente: number; pago: number }> = {};

    activations.forEach(act => {
      const reseller = resellers.find(r => r.id === act.reseller_id);
      if (!reseller) return;

      if (!resellerCommissions[act.reseller_id]) {
        resellerCommissions[act.reseller_id] = {
          name: reseller.name.length > 10 ? reseller.name.substring(0, 10) + '...' : reseller.name,
          pendente: 0,
          pago: 0,
        };
      }

      if (act.commission_status === 'pending') {
        resellerCommissions[act.reseller_id].pendente += act.commission_value || 0;
      } else if (act.commission_status === 'paid') {
        resellerCommissions[act.reseller_id].pago += act.commission_value || 0;
      }
    });

    return Object.values(resellerCommissions)
      .filter(r => r.pendente > 0 || r.pago > 0)
      .sort((a, b) => (b.pendente + b.pago) - (a.pendente + a.pago))
      .slice(0, 8);
  }, [activations, resellers]);

  // Totals
  const totalPendingCommission = activations
    .filter(a => a.commission_status === 'pending')
    .reduce((sum, a) => sum + (a.commission_value || 0), 0);

  const totalPaidCommission = activations
    .filter(a => a.commission_status === 'paid')
    .reduce((sum, a) => sum + (a.commission_value || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-400">Carregando gráficos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-yellow-300">Comissões Pendentes</p>
            <p className="text-lg sm:text-2xl font-bold text-yellow-400">{formatCurrency(totalPendingCommission)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-300">Comissões Pagas</p>
            <p className="text-lg sm:text-2xl font-bold text-green-400">{formatCurrency(totalPaidCommission)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Bar Chart - Clients per Reseller */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-white text-sm sm:text-lg flex items-center gap-2">
              👥 Clientes <span className="hidden sm:inline">por Revendedor</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-48 sm:h-64">
              {clientsPerReseller.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientsPerReseller} layout="vertical">
                    <XAxis 
                      type="number" 
                      stroke="#64748B"
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#64748B"
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                      width={70}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E293B', 
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, name: string) => [
                        value,
                        name === 'ativos' ? 'Ativos' : 'Inativos'
                      ]}
                    />
                    <Bar dataKey="ativos" stackId="a" fill="#22C55E" name="ativos" />
                    <Bar dataKey="inativos" stackId="a" fill="#EF4444" name="inativos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Sem dados para exibir
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Line Chart - Activations over time */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-white text-sm sm:text-lg flex items-center gap-2">
              📈 Ativações <span className="hidden sm:inline">nos Últimos 14 Dias</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activationsOverTime}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    axisLine={{ stroke: '#475569' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    stroke="#64748B"
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    axisLine={{ stroke: '#475569' }}
                    allowDecimals={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ativações" 
                    stroke="#A855F7" 
                    strokeWidth={2}
                    dot={{ fill: '#A855F7', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, fill: '#C084FC' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Pricing Mode Distribution */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-white text-sm sm:text-lg flex items-center gap-2">
              🍩 Modo <span className="hidden sm:inline">de Operação</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-48 sm:h-64 flex items-center">
              {pricingModeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pricingModeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#64748B' }}
                    >
                      {pricingModeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E293B', 
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`${value} revendedores`, '']}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }}
                      formatter={(value) => <span style={{ color: '#CBD5E1' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full text-center text-slate-400 text-sm">
                  Sem dados para exibir
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Commissions per Reseller */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-white text-sm sm:text-lg flex items-center gap-2">
              💰 Comissões <span className="hidden sm:inline">por Revendedor</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-48 sm:h-64">
              {commissionsPerReseller.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={commissionsPerReseller} layout="vertical">
                    <XAxis 
                      type="number" 
                      stroke="#64748B"
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                      tickFormatter={(value) => `R$${value}`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#64748B"
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                      width={70}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E293B', 
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'pendente' ? 'Pendente' : 'Pago'
                      ]}
                    />
                    <Bar dataKey="pendente" stackId="a" fill="#F59E0B" name="pendente" />
                    <Bar dataKey="pago" stackId="a" fill="#22C55E" name="pago" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Sem comissões registradas
                </div>
              )}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-500"></span>
                <span className="text-slate-400">Pendente</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span>
                <span className="text-slate-400">Pago</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
