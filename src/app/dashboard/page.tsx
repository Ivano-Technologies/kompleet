import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { 
  getMonthlyIncomeExpenses, 
  getCategoryBreakdown, 
  getTaxProjections, 
  getComplianceMetrics 
} from '@/lib/dashboard/data-aggregation';
import { IncomeExpensesChart } from '@/components/charts/IncomeExpensesChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { TaxProjectionChart } from '@/components/charts/TaxProjectionChart';
import { ComplianceHealthMeter } from '@/components/charts/ComplianceHealthMeter';
import {
  Navigation,
  Logo,
  Container,
  Section,
  Grid,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from '@/components/nextauth-ui';

/**
 * KOMPLEET Dashboard - NextAuth Design
 * 
 * Features:
 * - NextAuth-style navigation
 * - Flat design (no glassmorphism, no shadows)
 * - Nigerian green accents
 * - Grid layout for stats and charts
 * - Quick actions section
 */
export default async function DashboardPage() {
  const supabase = await createServerClient();
  
  try {
    const user = await requireServerUser(supabase);

    // Fetch all dashboard data
    const [incomeExpenses, categoryBreakdown, taxProjections, complianceMetrics] = await Promise.all([
      getMonthlyIncomeExpenses(user.id),
      getCategoryBreakdown(user.id),
      getTaxProjections(user.id),
      getComplianceMetrics(user.id),
    ]);

    const navLinks = [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/transactions', label: 'Transactions' },
      { href: '/tax-calculators', label: 'Tax Calculators' },
      { href: '/e-invoicing', label: 'E-Invoicing' },
      { href: '/reports', label: 'Reports' },
    ];

    return (
      <>
        {/* Navigation */}
        <Navigation
          logo={<Logo text="KOMPLEET" imageSrc="/assets/logo-primary.png" />}
          links={navLinks}
          rightContent={<LogoutButton />}
        />

        {/* Dashboard Content */}
        <div className="min-h-screen bg-background">
          <Section spacing="md">
            {/* Welcome Header */}
            <div className="mb-8">
              <h1 className="text-h1 text-foreground mb-2">
                Welcome back, {user.email?.split('@')[0]}!
              </h1>
              <p className="text-body text-muted italic">
                Kompleet records. Kompleet filings. Kompleet compliance.
              </p>
            </div>

            {/* Quick Stats */}
            <Grid columns={4} gap="md" className="mb-12">
              <Card>
                <div className="text-sm text-muted mb-2">Total Transactions</div>
                <div className="text-h2 text-foreground">{complianceMetrics.totalTransactions}</div>
              </Card>

              <Card>
                <div className="text-sm text-muted mb-2">Categorized</div>
                <div className="text-h2 text-primary">{complianceMetrics.categorizedTransactions}</div>
              </Card>

              <Card>
                <div className="text-sm text-muted mb-2">Reconciliation</div>
                <div className="text-h2 text-foreground">{complianceMetrics.reconciliationRate}%</div>
              </Card>

              <Card>
                <div className="text-sm text-muted mb-2">Tax Readiness</div>
                <div className="text-h2 text-foreground">{complianceMetrics.taxReadinessScore}%</div>
              </Card>
            </Grid>

            {/* Charts Grid */}
            <Grid columns={2} gap="lg" className="mb-12">
              {/* Income vs Expenses Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Income vs Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <IncomeExpensesChart data={incomeExpenses} />
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {categoryBreakdown.length > 0 ? (
                      <CategoryBreakdownChart data={categoryBreakdown} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted">
                        No expense data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tax Projection Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Tax Projections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {taxProjections.length > 0 ? (
                      <TaxProjectionChart data={taxProjections} />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted">
                        No tax projection data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ComplianceHealthMeter metrics={complianceMetrics} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Grid columns={3} gap="md">
                  <Link href="/transactions/upload">
                    <Button variant="secondary" className="w-full">
                      📤 Upload Bank Statement
                    </Button>
                  </Link>
                  <Link href="/tax-calculators">
                    <Button variant="secondary" className="w-full">
                      🧮 Calculate Taxes
                    </Button>
                  </Link>
                  <Link href="/e-invoicing">
                    <Button variant="secondary" className="w-full">
                      📄 Create E-Invoice
                    </Button>
                  </Link>
                  <Link href="/transactions">
                    <Button variant="secondary" className="w-full">
                      💳 View Transactions
                    </Button>
                  </Link>
                  <Link href="/reports">
                    <Button variant="secondary" className="w-full">
                      📊 Generate Report
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="secondary" className="w-full">
                      ⚙️ Settings
                    </Button>
                  </Link>
                </Grid>
              </CardContent>
            </Card>

            {/* Tax Calculators Section */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Calculators</CardTitle>
              </CardHeader>
              <CardContent>
                <Grid columns={3} gap="md">
                  <Link href="/tax-calculators/personal-income">
                    <Button variant="secondary" className="w-full">
                      Personal Income Tax
                    </Button>
                  </Link>
                  <Link href="/tax-calculators/company-income">
                    <Button variant="secondary" className="w-full">
                      Company Income Tax
                    </Button>
                  </Link>
                  <Link href="/tax-calculators/vat">
                    <Button variant="secondary" className="w-full">
                      VAT Calculator
                    </Button>
                  </Link>
                  <Link href="/tax-calculators/withholding">
                    <Button variant="secondary" className="w-full">
                      Withholding Tax
                    </Button>
                  </Link>
                  <Link href="/tax-calculators/capital-gains">
                    <Button variant="secondary" className="w-full">
                      Capital Gains Tax
                    </Button>
                  </Link>
                  <Link href="/tax-calculators/stamp-duty">
                    <Button variant="secondary" className="w-full">
                      Stamp Duty
                    </Button>
                  </Link>
                </Grid>
              </CardContent>
            </Card>
          </Section>
        </div>
      </>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent>
            <p className="text-error-light">Failed to load dashboard. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
