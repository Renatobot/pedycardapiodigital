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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart - Registrations */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            📈 Cadastros nos Últimos 14 Dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={registrationData}>
                <XAxis 
                  dataKey="date" 
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  axisLine={{ stroke: '#475569' }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F8FAFC'
                  }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cadastros" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#60A5FA' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart - Plan Distribution */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            🍩 Distribuição de Planos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center">
            {planDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
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
                      color: '#F8FAFC'
                    }}
                    formatter={(value: number) => [`${value} estabelecimentos`, '']}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#94A3B8' }}
                    formatter={(value) => <span style={{ color: '#CBD5E1' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full text-center text-slate-400">
                Sem dados para exibir
              </div>
            )}
          </div>
          
          {/* Conversion Rate */}
          <div className="mt-4 p-3 bg-slate-700/50 rounded-lg text-center">
            <p className="text-sm text-slate-400">Taxa de Conversão Trial → Pro</p>
            <p className="text-2xl font-bold text-green-400">{conversionRate}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
