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
  Container,
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

      {/* Hero Section with Floating Logos - Dark Background */}
      <div className="relative bg-black/100 text-white min-h-[600px] flex items-center justify-center py-24 md:py-32">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            {/* Large KOMPLEET Logo */}
            <div className="mb-8">
              <img
                src="/assets/logo-primary.png"
                alt="KOMPLEET"
                className="w-48 h-48 mx-auto"
              />
            </div>

            {/* Badge */}
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                2026
              </span>
            </div>

            {/* Title */}
            <h1 className="text-7xl md:text-8xl font-black tracking-tight mb-6">
              KOMPLEET
            </h1>

            {/* Subtitle */}
            <p className="text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Tax Compliance for Nigerian Businesses
            </p>

            {/* Actions */}
            <div className="flex flex-row items-center justify-center gap-4 flex-wrap">
              <Link href="/sign-in">
                <Button size="lg">Get Started Free</Button>
              </Link>
              <Link href="/features">
                <Button variant="secondary" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Floating Logos */}
            <div className="mt-12">
              <FloatingLogos />
            </div>
          </div>
        </Container>
      </div>

      {/* Tagline Section - Dark Background */}
      <Section spacing="md" className="bg-black/100 text-white">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
            Kompleet records. <span className="text-gray-400">Kompleet filings.</span> Kompleet compliance.
          </h2>
        </div>
      </Section>

      {/* Features Section - Dark Background */}
      <Section spacing="lg" className="bg-black/100 text-white">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold mb-4">Built for Nigerian Businesses</h3>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Professional tax compliance and financial management platform fully aligned with the 2026 Nigerian Tax Act.
          </p>
        </div>
        
        <Grid columns={3}>
          {/* Feature 1: Easy */}
          <div className="text-center hover-lift p-8">
            <div className="w-40 h-40 rounded-full icon-gradient-purple flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Easy</h3>
            <ul className="space-y-2 text-gray-400 text-left max-w-xs mx-auto">
              <li>• Automated transaction categorization</li>
              <li>• Bank statement uploads</li>
              <li>• Email receipt parsing</li>
              <li>• One-click tax calculations</li>
            </ul>
          </div>

          {/* Feature 2: Flexible */}
          <div className="text-center hover-lift p-8">
            <div className="w-40 h-40 rounded-full icon-gradient-pink flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Flexible</h3>
            <ul className="space-y-2 text-gray-400 text-left max-w-xs mx-auto">
              <li>• Works for SMEs and freelancers</li>
              <li>• Multiple business support</li>
              <li>• Custom categories and rules</li>
              <li>• Export to Excel or PDF</li>
            </ul>
          </div>

          {/* Feature 3: Secure */}
          <div className="text-center hover-lift p-8">
            <div className="w-40 h-40 rounded-full icon-gradient-blue flex items-center justify-center mx-auto mb-6">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Secure</h3>
            <ul className="space-y-2 text-gray-400 text-left max-w-xs mx-auto">
              <li>• Bank-level encryption</li>
              <li>• NDPR compliant</li>
              <li>• Secure cloud storage</li>
              <li>• Regular security audits</li>
            </ul>
          </div>
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
