import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * NextAuth-style Container Component
 * 
 * Features:
 * - Max width: 1200px
 * - Centered with auto margins
 * - Horizontal padding: 24px
 * - Responsive
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'max-w-container mx-auto px-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';
