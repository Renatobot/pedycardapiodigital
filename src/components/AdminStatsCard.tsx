import { ReactNode, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AdminStatsCardProps {
  icon: ReactNode;
  value: number;
  label: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
}

export function AdminStatsCard({
  icon,
  value,
  label,
  trend,
  iconBgColor = 'bg-slate-700',
  iconColor = 'text-slate-300',
}: AdminStatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  // Animated counter effect
  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50 group">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
            iconBgColor
          )}>
            <div className={iconColor}>
              {icon}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-white tabular-nums">
              {displayValue}
            </p>
            <p className="text-sm text-slate-400">{label}</p>
            {trend && (
              <p className={cn(
                "text-xs mt-1 font-medium",
                trend.isPositive !== false ? "text-green-400" : "text-red-400"
              )}>
                {trend.isPositive !== false ? '↑' : '↓'} {trend.value} {trend.label}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
