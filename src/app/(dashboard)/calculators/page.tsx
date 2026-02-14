import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Grid,
  Section
} from '@/components/nextauth-ui';

/**
 * Tax Center Landing Page
 *
 * Showcases all available tax calculators with descriptions and quick access.
 * Phase 1: Business Tax (CIT), Individual Tax (PIT), VAT Compliance Checker
 * Phase 2: Stamp Duty, Capital Allowances, Property Tax
 */
export default function TaxCenterPage() {
  const calculators = [
    {
      id: 'business-tax',
      title: 'Business Tax Calculator (CIT)',
      description: 'Calculate Company Income Tax, Development Levy, and other business taxes based on Nigerian Tax Act 2026.',
      href: '/calculators/business-tax',
      icon: '🏢',
      phase: 1,
      features: [
        'Company Income Tax (0%, 30% standard rates)',
        'Development Levy (4% on assessable profit)',
        'Tertiary Education Tax (2.5% on profits)',
        'Tax relief calculations',
        'Band-by-band breakdown'
      ],
      tags: ['CIT', 'Business', 'Companies']
    },
    {
      id: 'individual-tax',
      title: 'Individual Tax Calculator (PIT)',
      description: 'Calculate Personal Income Tax using progressive bands and Nigerian personal reliefs.',
      href: '/calculators/individual-tax',
      icon: '👤',
      phase: 1,
      features: [
        'Progressive tax bands (7%, 11%, 15%, 19%, 21%)',
        'Personal relief (₦200,000 + 1% of gross income)',
        'Rent relief (₦500,000 max)',
        'Pension relief calculations',
        'Comprehensive income breakdown'
      ],
      tags: ['PIT', 'Personal', 'Individuals']
    },
    {
      id: 'vat',
      title: 'VAT Compliance Checker',
      description: 'Check if your business is subject to VAT and calculate VAT obligations at 7.5%.',
      href: '/calculators/vat',
      icon: '📊',
      phase: 1,
      features: [
        'Turnover threshold check (₦100M)',
        'Asset threshold check (₦250M)',
        'VAT calculation at 7.5%',
        'Exemption status determination',
        'Compliance recommendations'
      ],
      tags: ['VAT', 'Compliance', 'Sales Tax']
    },
    {
      id: 'stamp-duty',
      title: 'Stamp Duty Calculator',
      description: 'Calculate stamp duty on contracts, receipts, and legal instruments.',
      href: '/calculators/stamp-duty',
      icon: '📜',
      phase: 2,
      features: [
        'Contract stamp duty',
        'Receipt stamp duty',
        'Legal instrument duties',
        'Transaction-specific rates'
      ],
      tags: ['Stamp Duty', 'Contracts', 'Legal']
    },
    {
      id: 'capital-allowances',
      title: 'Capital Allowance Tracker',
      description: 'Track and calculate capital allowances for business assets and depreciation.',
      href: '/calculators/capital-allowances',
      icon: '🏭',
      phase: 2,
      features: [
        'Asset depreciation tracking',
        'Initial allowance calculations',
        'Annual allowance tracking',
        'Multi-year asset management'
      ],
      tags: ['Capital Allowances', 'Depreciation', 'Assets']
    },
    {
      id: 'property-tax',
      title: 'Property Tax Calculator',
      description: 'Calculate property taxes, land use charges, and tenement rates.',
      href: '/calculators/property-tax',
      icon: '🏠',
      phase: 2,
      features: [
        'Land use charge',
        'Tenement rate',
        'Property value assessment',
        'Location-based rates'
      ],
      tags: ['Property', 'Real Estate', 'Land']
    }
  ];

  const phase1Calculators = calculators.filter(c => c.phase === 1);
  const phase2Calculators = calculators.filter(c => c.phase === 2);

  return (
    <div>
      <Section spacing="lg">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-h1 text-foreground mb-4">
            🧮 Tax Center
          </h1>
          <p className="text-body text-muted max-w-2xl mx-auto">
            Professional tax calculators for Nigerian businesses and individuals.
            All calculations comply with the Nigerian Tax Act 2026 and FIRS regulations.
          </p>
        </div>

        {/* Phase 1 Calculators (MVP) */}
        <div className="mb-16">
          <h2 className="text-h2 text-foreground mb-6 flex items-center gap-3">
            <span>Essential Tax Calculators</span>
            <span className="text-xs bg-primary text-white px-3 py-1 rounded-full font-medium">
              Phase 1
            </span>
          </h2>

          <Grid columns={3} gap="lg">
            {phase1Calculators.map((calc) => (
              <Link key={calc.id} href={calc.href} className="block group">
                <Card className="h-full hover:border-primary transition-colors duration-200">
                  <CardHeader>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-5xl">{calc.icon}</div>
                      <div className="flex-1">
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {calc.title}
                        </CardTitle>
                        <div className="flex gap-2 mt-2">
                          {calc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-muted text-foreground px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted mb-4">{calc.description}</p>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-foreground mb-2">Features:</div>
                      <ul className="space-y-1">
                        {calc.features.map((feature, index) => (
                          <li key={index} className="text-xs text-muted flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 text-primary text-sm font-medium group-hover:underline">
                      Open Calculator →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </Grid>
        </div>

        {/* Phase 2 Calculators (Coming Soon) */}
        <div>
          <h2 className="text-h2 text-foreground mb-6 flex items-center gap-3">
            <span>Additional Calculators</span>
            <span className="text-xs bg-muted text-foreground px-3 py-1 rounded-full font-medium">
              Phase 2
            </span>
          </h2>

          <Grid columns={3} gap="lg">
            {phase2Calculators.map((calc) => (
              <Link key={calc.id} href={calc.href} className="block group">
                <Card className="h-full opacity-90 hover:opacity-100 transition-opacity duration-200">
                  <CardHeader>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-5xl grayscale">{calc.icon}</div>
                      <div className="flex-1">
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {calc.title}
                        </CardTitle>
                        <div className="flex gap-2 mt-2">
                          {calc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-muted text-foreground px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted mb-4">{calc.description}</p>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-foreground mb-2">Features:</div>
                      <ul className="space-y-1">
                        {calc.features.map((feature, index) => (
                          <li key={index} className="text-xs text-muted flex items-start gap-2">
                            <span className="text-muted">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 text-primary text-sm font-medium group-hover:underline">
                      Open Calculator →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </Grid>
        </div>

        {/* Help Section */}
        <Card className="mt-16">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">How It Works</h3>
                <ol className="space-y-2 text-sm text-muted">
                  <li>1. Select a calculator from above</li>
                  <li>2. Enter your financial information</li>
                  <li>3. Review the calculated tax obligations</li>
                  <li>4. Export the results as PDF or save to your account</li>
                  <li>5. Use the breakdown to file your taxes accurately</li>
                </ol>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Accuracy Guarantee</h3>
                <p className="text-sm text-muted mb-4">
                  All calculations are based on the latest Nigerian Tax Act 2026 and FIRS regulations.
                  Our algorithms are regularly updated to reflect tax law changes.
                </p>
                <p className="text-sm text-muted">
                  For complex tax situations, we recommend consulting with a licensed tax professional.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
