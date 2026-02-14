import { cn } from '@/lib/utils';
import { CheckCircle, Clock, XCircle, AlertTriangle, Pencil } from 'lucide-react';
import { ReactNode } from 'react';

interface StatusBadgeProps {
  status: 'success' | 'pending' | 'failed' | 'overdue' | 'paid' | 'draft';
  label?: string;
  className?: string;
}

/**
 * StatusBadge - Status indicator component
 * 
 * Displays status with appropriate color coding.
 * Used for transactions, invoices, and other status indicators.
 */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { className: string; icon: ReactNode; defaultLabel: string }> = {
    success: {
      className: 'status-success',
      icon: <CheckCircle className="w-3 h-3" />,
      defaultLabel: 'Success'
    },
    pending: {
      className: 'status-pending',
      icon: <Clock className="w-3 h-3" />,
      defaultLabel: 'Pending'
    },
    failed: {
      className: 'status-failed',
      icon: <XCircle className="w-3 h-3" />,
      defaultLabel: 'Failed'
    },
    overdue: {
      className: 'status-overdue',
      icon: <AlertTriangle className="w-3 h-3" />,
      defaultLabel: 'Overdue'
    },
    paid: {
      className: 'status-success',
      icon: <CheckCircle className="w-3 h-3" />,
      defaultLabel: 'Paid'
    },
    draft: {
      className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
      icon: <Pencil className="w-3 h-3" />,
      defaultLabel: 'Draft'
    }
  };

  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
      config.className,
      className
    )}>
      {config.icon}
      {displayLabel}
    </span>
  );
}
