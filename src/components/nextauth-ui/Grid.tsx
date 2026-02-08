import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

/**
 * NextAuth-style Grid Component
 * 
 * Features:
 * - Responsive grid layout
 * - 1-4 columns on desktop
 * - Always 1 column on mobile
 * - Configurable gap spacing
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ columns = 3, gap = 'lg', className, children, ...props }, ref) => {
    const columnStyles = {
      1: 'md:grid-cols-1',
      2: 'md:grid-cols-2',
      3: 'md:grid-cols-3',
      4: 'md:grid-cols-4',
    };

    const gapStyles = {
      sm: 'gap-6',
      md: 'gap-8',
      lg: 'gap-10',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid grid-cols-1',
          columnStyles[columns],
          gapStyles[gap],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';
