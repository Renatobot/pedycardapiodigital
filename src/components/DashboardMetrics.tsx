import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Ticket, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/whatsapp';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardMetricsProps {
  establishmentId: string;
}

interface MetricData {
  todayRevenue: number;
  todayOrders: number;
  avgTicket: number;
  weekRevenue: number;
  weekOrders: number;
  lastWeekRevenue: number;
  dailyData: { date: string; revenue: number; orders: number }[];
}

export function DashboardMetrics({ establishmentId }: DashboardMetricsProps) {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);
        
        const lastWeekStart = new Date(now);
        lastWeekStart.setDate(lastWeekStart.getDate() - 14);
        lastWeekStart.setHours(0, 0, 0, 0);

        // Fetch all orders from last 14 days for comparison
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select('total, created_at, status')
          .eq('establishment_id', establishmentId)
          .gte('created_at', lastWeekStart.toISOString())
          .not('status', 'in', '("cancelled","rejected")');

        if (error) throw error;

        const orders = ordersData || [];

        // Calculate metrics
        const todayOrders = orders.filter(o => new Date(o.created_at) >= todayStart);
        const weekOrders = orders.filter(o => new Date(o.created_at) >= weekStart);
        const lastWeekOrders = orders.filter(o => {
          const date = new Date(o.created_at);
          return date >= lastWeekStart && date < weekStart;
        });

        const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const avgTicket = weekOrders.length > 0 ? weekRevenue / weekOrders.length : 0;

        // Build daily data for chart (last 7 days)
        const dailyData: { date: string; revenue: number; orders: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          
          const dayOrders = orders.filter(o => {
            const oDate = new Date(o.created_at);
            return oDate >= date && oDate < nextDay;
          });
          
          dailyData.push({
            date: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
            revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            orders: dayOrders.length,
          });
        }

        setMetrics({
          todayRevenue,
          todayOrders: todayOrders.length,
          avgTicket,
          weekRevenue,
          weekOrders: weekOrders.length,
          lastWeekRevenue,
          dailyData,
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [establishmentId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const weekChange = metrics.lastWeekRevenue > 0 
    ? ((metrics.weekRevenue - metrics.lastWeekRevenue) / metrics.lastWeekRevenue) * 100 
    : 0;
  const isPositive = weekChange >= 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">Hoje</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(metrics.todayRevenue)}</p>
            <p className="text-xs text-muted-foreground">{metrics.todayOrders} pedidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs">Semana</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(metrics.weekRevenue)}</p>
            <p className="text-xs text-muted-foreground">{metrics.weekOrders} pedidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Ticket className="w-4 h-4" />
              <span className="text-xs">Ticket Médio</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(metrics.avgTicket)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {isPositive ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
              <span className="text-xs">vs. Semana Anterior</span>
            </div>
            <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{weekChange.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Faturamento - Últimos 7 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.dailyData}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                  labelFormatter={(label) => `${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
