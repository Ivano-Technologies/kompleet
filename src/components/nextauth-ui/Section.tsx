import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Container } from './Container';

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

/**
 * NextAuth-style Section Component
 * 
 * Features:
 * - Generous vertical padding (64-96px)
 * - Optional container wrapper
 * - Responsive spacing
 * - Semantic HTML (section tag)
 */
export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ spacing = 'md', fullWidth = false, className, children, ...props }, ref) => {
    const spacingStyles = {
      sm: 'py-12 md:py-16',
      md: 'py-16 md:py-24',
      lg: 'py-24 md:py-32',
    };

    const content = (
      <section
        ref={ref}
        className={cn(
          spacingStyles[spacing],
          className
        )}
        {...props}
      >
        {fullWidth ? children : <Container>{children}</Container>}
      </section>
    );

    return content;
  }
);

Section.displayName = 'Section';

/**
 * Section Header Component
 */
export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ title, subtitle, centered = true, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mb-12',
          centered && 'text-center',
          className
        )}
        {...props}
      >
        <h2 className="text-h1 text-foreground mb-4">
          {title}
        </h2>
        {subtitle && (
          <p className="text-body text-muted max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
    );
  }
);

SectionHeader.displayName = 'SectionHeader';
