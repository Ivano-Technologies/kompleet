import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  hover?: boolean;
}

/**
 * GlassCard - Glassmorphism card component
 * 
 * A card component with frosted glass effect (glassmorphism).
 * Follows the KOMPLEET design system with Nigerian Green accents.
 * 
 * @param variant - 'default' (semi-transparent), 'light' (more opaque), or 'dark'
 * @param hover - Enable hover lift effect
 */
export function GlassCard({ 
  children, 
  className, 
  variant = 'default',
  hover = false 
}: GlassCardProps) {
  const variantClasses = {
    default: 'glass-card',
    light: 'glass-card-light',
    dark: 'glass-card bg-opacity-10',
  };

  return (
    <div 
      className={cn(
        variantClasses[variant],
        hover && 'hover-lift cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
