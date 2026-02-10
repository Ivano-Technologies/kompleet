import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * NextAuth-style Input Component
 * 
 * Features:
 * - Flat design (no shadows)
 * - Nigerian green focus border
 * - 200ms transitions
 * - Rounded corners (8px)
 * - Optional label and error message
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-surface border border-border rounded-lg px-4 py-3',
            'text-base text-foreground placeholder:text-muted',
            'focus:outline-none focus:border-primary',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-error-light',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-error-light">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea Component
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-surface border border-border rounded-lg px-4 py-3',
            'text-base text-foreground placeholder:text-muted',
            'focus:outline-none focus:border-primary',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[120px]',
            error && 'border-error-light',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-error-light">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
