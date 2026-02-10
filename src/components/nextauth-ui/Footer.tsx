import Link from 'next/link';
import { Container } from './Container';

export interface FooterColumn {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}

export interface FooterProps {
  columns: FooterColumn[];
  tagline?: string;
  copyright?: string;
}

/**
 * NextAuth-style Footer Component
 * 
 * Features:
 * - 3-column layout
 * - Centered tagline above columns
 * - Centered copyright below columns
 * - Generous vertical padding (64px)
 * - Same background as page (seamless integration)
 */
export function Footer({ columns, tagline, copyright }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const copyrightText = copyright || `KOMPLEET © ${currentYear}`;

  return (
    <footer className="bg-background py-16">
      <Container>
        {/* Tagline */}
        {tagline && (
          <p className="text-center text-base text-muted italic mb-12">
            {tagline}
          </p>
        )}

        {/* Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-base font-bold text-foreground mb-4">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted hover:text-foreground transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-center text-caption text-muted">
          {copyrightText}
        </p>
      </Container>
    </footer>
  );
}
