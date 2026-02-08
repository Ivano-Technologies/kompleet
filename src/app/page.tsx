import Link from 'next/link';
import {
  Hero,
  Section,
  SectionHeader,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Navigation,
  Logo,
  Footer,
  FloatingLogos,
} from '@/components/nextauth-ui';

/**
 * KOMPLEET Landing Page - NextAuth Design
 * 
 * Features:
 * - NextAuth-style hero with floating logos
 * - 3-column feature grid
 * - Flat design (no glassmorphism, no shadows)
 * - Nigerian green accents
 * - Pure black/white theme
 */
export default function Home() {
  const navLinks = [
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
  ];

  const footerColumns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Tax Calculators', href: '/tax-calculators' },
        { label: 'E-Invoicing', href: '/e-invoicing' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
  ];

  return (
    <>
      {/* Navigation */}
      <Navigation
        logo={<Logo text="KOMPLEET" imageSrc="/assets/logo-primary.png" />}
        links={navLinks}
        rightContent={
          <>
            <Link href="/sign-in">
              <Button variant="secondary" size="sm">
                Sign In
              </Button>
            </Link>
          </>
        }
      />

      {/* Hero Section with Floating Logos */}
      <Hero
        badge="2026"
        title="KOMPLEET"
        subtitle="Kompleet records. Kompleet filings. Kompleet compliance."
        actions={
          <>
            <Link href="/sign-in">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/features">
              <Button variant="secondary" size="lg">
                Learn More
              </Button>
            </Link>
          </>
        }
      >
        <FloatingLogos />
      </Hero>

      {/* Features Section */}
      <Section spacing="lg">
        <SectionHeader
          title="Built for Nigerian Businesses"
          subtitle="Professional tax compliance and financial management platform fully aligned with the 2026 Nigerian Tax Act."
        />
        
        <Grid columns={3}>
          {/* Feature 1: Easy */}
          <Card variant="feature" className="text-center hover-lift">
            <div className="w-24 h-24 rounded-full icon-gradient-purple flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <CardHeader>
              <CardTitle>Easy</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted">
                <li>Automated transaction categorization</li>
                <li>Bank statement uploads</li>
                <li>Email receipt parsing</li>
                <li>One-click tax calculations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Feature 2: Flexible */}
          <Card variant="feature" className="text-center hover-lift">
            <div className="w-24 h-24 rounded-full icon-gradient-pink flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <CardHeader>
              <CardTitle>Flexible</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted">
                <li>Works for SMEs and freelancers</li>
                <li>Multiple business support</li>
                <li>Custom categories and rules</li>
                <li>Export to Excel or PDF</li>
              </ul>
            </CardContent>
          </Card>

          {/* Feature 3: Secure */}
          <Card variant="feature" className="text-center hover-lift">
            <div className="w-24 h-24 rounded-full icon-gradient-blue flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <CardHeader>
              <CardTitle>Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted">
                <li>Bank-level encryption</li>
                <li>NDPR compliant</li>
                <li>Secure cloud storage</li>
                <li>Regular security audits</li>
              </ul>
            </CardContent>
          </Card>
        </Grid>
      </Section>

      {/* CTA Section */}
      <Section spacing="lg" className="bg-surface border-y border-border">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-h1 text-foreground mb-6">
            Start managing your taxes today
          </h2>
          <p className="text-body text-muted mb-8">
            Join hundreds of Nigerian businesses using KOMPLEET for tax compliance and financial management.
          </p>
          <Link href="/sign-in">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </Section>

      {/* Footer */}
      <Footer
        columns={footerColumns}
        tagline="Kompleet records. Kompleet filings. Kompleet compliance."
        copyright="KOMPLEET © 2026. All rights reserved."
      />
    </>
  );
}
