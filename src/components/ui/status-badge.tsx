import { cn } from '@/lib/utils';

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
  const statusConfig = {
    success: {
      className: 'status-success',
      icon: 'check_circle',
      defaultLabel: 'Success'
    },
    pending: {
      className: 'status-pending',
      icon: 'schedule',
      defaultLabel: 'Pending'
    },
    failed: {
      className: 'status-failed',
      icon: 'cancel',
      defaultLabel: 'Failed'
    },
    overdue: {
      className: 'status-overdue',
      icon: 'warning',
      defaultLabel: 'Overdue'
    },
    paid: {
      className: 'status-success',
      icon: 'check_circle',
      defaultLabel: 'Paid'
    },
    draft: {
      className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
      icon: 'edit',
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
      <span className="material-icons text-xs">{config.icon}</span>
      {displayLabel}
    </span>
  );
}
