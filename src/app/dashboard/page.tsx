import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import { redirect } from 'next/navigation';
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

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              {/* KOMPLEET Logo */}
              <img 
                src="/assets/logo-inverted.png" 
                alt="KOMPLEET Logo" 
                className="w-16 h-16"
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                  KOMPLEET Dashboard
                </h1>
                <p className="text-gray-300 mb-1">Welcome back, {user.email?.split('@')[0]}!</p>
                <p className="text-sm text-gray-400 italic">Kompleet records. Kompleet filings. Kompleet compliance.</p>
              </div>
            </div>
            <LogoutButton />
          </div>

          {/* Quick Stats - Glassmorphism Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Transactions */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="text-gray-300 text-sm mb-2">Total Transactions</div>
              <div className="text-3xl font-bold text-white">{complianceMetrics.totalTransactions}</div>
            </div>

            {/* Categorized */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="text-gray-300 text-sm mb-2">Categorized</div>
              <div className="text-3xl font-bold text-green-400">{complianceMetrics.categorizedTransactions}</div>
            </div>

            {/* Reconciliation Rate */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="text-gray-300 text-sm mb-2">Reconciliation</div>
              <div className="text-3xl font-bold text-blue-400">{complianceMetrics.reconciliationRate}%</div>
            </div>

            {/* Tax Readiness */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="text-gray-300 text-sm mb-2">Tax Readiness</div>
              <div className="text-3xl font-bold text-yellow-400">{complianceMetrics.taxReadinessScore}%</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Income vs Expenses Chart */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Income vs Expenses</h2>
              <div className="h-80">
                <IncomeExpensesChart data={incomeExpenses} />
              </div>
            </div>

            {/* Category Breakdown Chart */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Expense Categories</h2>
              <div className="h-80">
                {categoryBreakdown.length > 0 ? (
                  <CategoryBreakdownChart data={categoryBreakdown} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No expense data available
                  </div>
                )}
              </div>
            </div>

            {/* Tax Projection Chart */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Tax Projections</h2>
              <div className="h-80">
                <TaxProjectionChart data={taxProjections} />
              </div>
            </div>

            {/* Compliance Health Meter */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Compliance Health</h2>
              <div className="h-80">
                <ComplianceHealthMeter data={complianceMetrics} />
              </div>
            </div>
          </div>

          {/* Navigation Links - Glassmorphism */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
            
            {/* Main Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <Link 
                href="/transactions" 
                className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl p-4 transition-all duration-200 hover:scale-105"
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="text-white font-semibold">Transactions</div>
                <div className="text-gray-300 text-sm">View & manage</div>
              </Link>

              <Link 
                href="/history" 
                className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl p-4 transition-all duration-200 hover:scale-105"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="text-white font-semibold">History</div>
                <div className="text-gray-300 text-sm">Calculation history</div>
              </Link>

              <Link 
                href="/reports" 
                className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl p-4 transition-all duration-200 hover:scale-105"
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="text-white font-semibold">Reports</div>
                <div className="text-gray-300 text-sm">Financial reports</div>
              </Link>

              <Link 
                href="/profile" 
                className="bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 rounded-xl p-4 transition-all duration-200 hover:scale-105"
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="text-white font-semibold">Profile</div>
                <div className="text-gray-300 text-sm">Account settings</div>
              </Link>
            </div>

            {/* Tax Calculators */}
            <h4 className="text-lg font-semibold text-white mb-3">Tax Calculators</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link 
                href="/calculators/business-tax" 
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105"
              >
                <div className="text-white text-sm font-medium">Business Tax</div>
              </Link>

              <Link 
                href="/calculators/individual-tax" 
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105"
              >
                <div className="text-white text-sm font-medium">Individual Tax</div>
              </Link>

              <Link 
                href="/calculators/vat" 
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105"
              >
                <div className="text-white text-sm font-medium">VAT</div>
              </Link>

              <Link 
                href="/calculators/capital-allowances" 
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105"
              >
                <div className="text-white text-sm font-medium">Capital Allowances</div>
              </Link>

              <Link 
                href="/calculators/stamp-duty" 
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105"
              >
                <div className="text-white text-sm font-medium">Stamp Duty</div>
              </Link>

              <Link 
                href="/calculators/property-tax" 
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-3 text-center transition-all duration-200 hover:scale-105"
              >
                <div className="text-white text-sm font-medium">Property Tax</div>
              </Link>
            </div>
          </div>

          {/* Footer with Branding */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm mb-2">
              © 2026 Ivano Technologies Ltd. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs italic">
              Kompleet records. Kompleet filings. Kompleet compliance.
            </p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // User not authenticated - redirect to login
    redirect('/login');
  }
}
