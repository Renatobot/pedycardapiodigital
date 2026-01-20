import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useMemo } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Establishment {
  id: string;
  name: string;
  plan_status: string;
  has_pro_plus: boolean;
  created_at: string;
}

interface AdminChartsProps {
  establishments: Establishment[];
}

export function AdminCharts({ establishments }: AdminChartsProps) {
  // Calculate daily registrations for last 14 days
  const registrationData = useMemo(() => {
    const days = 14;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const nextDate = startOfDay(subDays(new Date(), i - 1));
      
      const count = establishments.filter(est => {
        const createdAt = new Date(est.created_at);
        return createdAt >= date && createdAt < nextDate;
      }).length;
      
      data.push({
        date: format(date, 'dd/MM', { locale: ptBR }),
        cadastros: count,
      });
    }
    
    return data;
  }, [establishments]);

  // Calculate plan distribution
  const planDistribution = useMemo(() => {
    const trial = establishments.filter(e => e.plan_status === 'trial').length;
    const active = establishments.filter(e => e.plan_status === 'active' && !e.has_pro_plus).length;
    const proPlus = establishments.filter(e => e.has_pro_plus).length;
    const expired = establishments.filter(e => e.plan_status === 'expired').length;

    return [
      { name: 'Trial', value: trial, color: '#3B82F6' },
      { name: 'Pro', value: active, color: '#22C55E' },
      { name: 'Pro+', value: proPlus, color: '#A855F7' },
      { name: 'Expirado', value: expired, color: '#EF4444' },
    ].filter(item => item.value > 0);
  }, [establishments]);

  const totalEstablishments = establishments.length;
  const conversionRate = totalEstablishments > 0 
    ? Math.round((establishments.filter(e => e.plan_status === 'active').length / totalEstablishments) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Line Chart - Registrations */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-white text-sm sm:text-lg flex items-center gap-2">
            📈 Cadastros <span className="hidden sm:inline">nos Últimos 14 Dias</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={registrationData}>
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
                  dataKey="cadastros" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#60A5FA' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Plan Distribution */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-white text-sm sm:text-lg flex items-center gap-2">
            🍩 Distribuição <span className="hidden sm:inline">de Planos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-48 sm:h-64 flex items-center">
            {planDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#64748B' }}
                  >
                    {planDistribution.map((entry, index) => (
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
                    formatter={(value: number) => [`${value} estabelecimentos`, '']}
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
          
          {/* Conversion Rate */}
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-slate-700/50 rounded-lg text-center">
            <p className="text-xs sm:text-sm text-slate-400">Taxa de Conversão Trial → Pro</p>
            <p className="text-xl sm:text-2xl font-bold text-green-400">{conversionRate}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
