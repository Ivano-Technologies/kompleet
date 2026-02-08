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
          <Card variant="feature" className="text-center">
            <div className="w-[200px] h-[200px] rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">📊</span>
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
          <Card variant="feature" className="text-center">
            <div className="w-[200px] h-[200px] rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">🔧</span>
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
          <Card variant="feature" className="text-center">
            <div className="w-[200px] h-[200px] rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">🔒</span>
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
