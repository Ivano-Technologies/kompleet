import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

/**
 * NextAuth-style Button Component
 * 
 * Variants:
 * - primary: Nigerian green background, white text
 * - secondary: Transparent background, Nigerian green border (dashed on hover)
 * - danger: Red background, white text
 * 
 * Features:
 * - Flat design (no shadows)
 * - 200ms transitions
 * - Rounded corners (24px)
 * - Bold text (600 weight)
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-3xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
      primary: 'bg-primary hover:bg-primary-hover text-white',
      secondary: 'bg-transparent border border-primary text-primary hover:border-dashed hover:border-2',
      danger: 'bg-error-light hover:opacity-90 text-white',
    };
    
    const sizeStyles = {
      sm: 'px-6 py-2 text-sm',
      md: 'px-8 py-3 text-base',
      lg: 'px-10 py-4 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
