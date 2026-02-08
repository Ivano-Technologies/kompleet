'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Container } from './Container';

export interface NavLink {
  href: string;
  label: string;
}

export interface NavigationProps {
  logo?: React.ReactNode;
  links: NavLink[];
  rightContent?: React.ReactNode;
}

/**
 * NextAuth-style Navigation Component
 * 
 * Features:
 * - Sticky positioning
 * - 64px height
 * - Subtle bottom border
 * - Active link highlighting with Nigerian green
 * - Smooth transitions
 */
export function Navigation({ logo, links, rightContent }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <Container>
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            {logo && (
              <Link href="/" className="flex items-center">
                {logo}
              </Link>
            )}
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {links.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'text-base font-medium transition-colors duration-200',
                      isActive
                        ? 'text-primary'
                        : 'text-foreground hover:text-primary'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Content (Theme Toggle, User Menu, etc.) */}
          {rightContent && (
            <div className="flex items-center gap-4">
              {rightContent}
            </div>
          )}
        </div>
      </Container>
    </nav>
  );
}

/**
 * Logo Component
 */
export interface LogoProps {
  text?: string;
  imageSrc?: string;
  imageAlt?: string;
}

export function Logo({ text = 'KOMPLEET', imageSrc, imageAlt = 'Logo' }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      {imageSrc && (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-8 h-8"
        />
      )}
      <span className="text-lg font-semibold text-foreground">
        {text}
      </span>
    </div>
  );
}
