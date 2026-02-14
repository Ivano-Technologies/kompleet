import { ReactNode } from 'react';
import { GlassCard } from './glass-card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  subtitle?: string;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
}

/**
 * StatCard - Metric display card with glassmorphism
 * 
 * Displays a key metric with optional icon, trend indicator, and subtitle.
 * Used in dashboards and overview pages.
 */
export function StatCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  className,
  variant = 'default'
}: StatCardProps) {
  return (
    <GlassCard variant={variant} className={cn('p-6', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-1">
            {title}
          </p>
        </div>
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded',
            trend.direction === 'up' 
              ? 'text-green-600 bg-green-500/10' 
              : 'text-red-600 bg-red-500/10'
          )}>
            {trend.direction === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend.value}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
