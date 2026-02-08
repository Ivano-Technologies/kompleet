import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Container } from './Container';

export interface HeroProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: string;
  children?: React.ReactNode;
}

/**
 * NextAuth-style Hero Component
 * 
 * Features:
 * - Centered content
 * - Large hero heading (72px)
 * - Optional badge above title
 * - Action buttons below subtitle
 * - Generous spacing
 */
export const Hero = forwardRef<HTMLDivElement, HeroProps>(
  ({ title, subtitle, actions, badge, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative min-h-[600px] flex items-center justify-center',
          'py-24 md:py-32',
          className
        )}
        {...props}
      >
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            {badge && (
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                  {badge}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-hero mb-6 font-black tracking-tight">
              {title}
            </h1>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-h3 text-gray-400 mb-8 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}

            {/* Actions */}
            {actions && (
              <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
                {actions}
              </div>
            )}

            {/* Additional Content */}
            {children && (
              <div className="mt-12">
                {children}
              </div>
            )}
          </div>
        </Container>
      </div>
    );
  }
);

Hero.displayName = 'Hero';
