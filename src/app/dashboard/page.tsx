import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import { SolidDashboardLayout } from '@/components/layout/SolidDashboardLayout';

/**
 * KOMPLEET Dashboard - Financial Health Overview
 * 
 * Design: Solid dark theme with sidebar navigation
 * Features:
 * - KPI cards (Revenue, Tax Owed, Outstanding Invoices)
 * - Monthly Cash Flow chart
 * - Recent Transactions table
 * - Upcoming deadline reminder
 */
export default async function DashboardPage() {
  const supabase = await createServerClient();
  
  try {
    const user = await requireServerUser(supabase);

    // Mock data - replace with actual data fetching
    const kpiData = {
      totalRevenue: 4820000,
      revenueChange: 12.5,
      estimatedTax: 342150,
      taxDueIn: 14,
      outstandingInvoices: 1205000,
      pendingCount: 6,
    };

    const recentTransactions = [
      {
        id: 1,
        description: 'Mainstack Payout',
        category: 'Sales Income',
        date: 'Oct 24, 2024',
        amount: 450000,
        status: 'SUCCESS',
      },
      {
        id: 2,
        description: 'AWS Infrastructure',
        category: 'Technology',
        date: 'Oct 22, 2024',
        amount: 12400,
        status: 'SUCCESS',
      },
      {
        id: 3,
        description: 'Client: Glo Nigeria',
        category: 'Invoicing',
        date: 'Oct 20, 2024',
        amount: 890000,
        status: 'PENDING',
      },
    ];

    return (
      <SolidDashboardLayout userName={user.email?.split('@')[0]} userRole="Business Owner">
        {/* Header */}
        <div className="bg-light-background dark:bg-dark-background border-b border-light-border dark:border-dark-border px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                Financial Health Overview
              </h1>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                Welcome back. Here's what's happening with your business today.
              </p>
            </div>
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl">
              <span className="material-icons">add</span>
              Create Invoice
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-6">
            {/* Total Revenue */}
            <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-success-500">trending_up</span>
                  <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total Revenue (MTD)</span>
                </div>
                <span className="text-xs font-semibold text-success-500 bg-success-500/10 px-2 py-1 rounded">
                  +{kpiData.revenueChange}%
                </span>
              </div>
              <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
                ₦{kpiData.totalRevenue.toLocaleString()}
              </div>
            </div>

            {/* Estimated Tax Owed */}
            <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-warning-500">account_balance</span>
                  <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Estimated Tax Owed</span>
                </div>
                <span className="text-xs font-semibold text-warning-500 bg-warning-500/10 px-2 py-1 rounded">
                  Due in {kpiData.taxDueIn}d
                </span>
              </div>
              <div className="text-3xl font-bold text-warning-500">
                ₦{kpiData.estimatedTax.toLocaleString()}
              </div>
              <button className="text-sm text-primary-500 hover:text-primary-400 mt-3 flex items-center gap-1">
                View breakdowns
                <span className="material-icons text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Outstanding Invoices */}
            <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-info-500">pending_actions</span>
                  <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Outstanding Invoices</span>
                </div>
                <span className="text-xs font-semibold text-info-500 bg-info-500/10 px-2 py-1 rounded">
                  {kpiData.pendingCount} Pending
                </span>
              </div>
              <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-3">
                ₦{kpiData.outstandingInvoices.toLocaleString()}
                <span className="material-icons text-info-500 text-2xl">show_chart</span>
              </div>
            </div>
          </div>

          {/* Monthly Cash Flow Chart */}
          <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
                  Monthly Cash Flow
                </h2>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Revenue visualization for 2024
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors">
                  <span className="w-3 h-3 rounded-full bg-success-500"></span>
                  Cash Inflow
                </button>
                <button className="px-4 py-2 rounded-lg bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors">
                  Last 4 Months
                </button>
              </div>
            </div>
            {/* Chart Placeholder */}
            <div className="h-64 flex items-center justify-center border border-dashed border-light-border dark:border-dark-border rounded-lg">
              <p className="text-light-text-tertiary dark:text-dark-text-tertiary">Chart visualization here</p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                Recent Transactions
              </h2>
              <button className="text-primary-500 hover:text-primary-400 font-medium flex items-center gap-1">
                View All Transactions
                <span className="material-icons text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border">
                    <th className="text-left text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide pb-3">
                      Transaction
                    </th>
                    <th className="text-left text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide pb-3">
                      Category
                    </th>
                    <th className="text-left text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide pb-3">
                      Date
                    </th>
                    <th className="text-right text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide pb-3">
                      Amount
                    </th>
                    <th className="text-right text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide pb-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-light-border/50 dark:border-dark-border/50 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                            <span className="material-icons text-primary-500 text-sm">
                              {transaction.status === 'SUCCESS' ? 'arrow_downward' : 'schedule'}
                            </span>
                          </div>
                          <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                            {transaction.description}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-light-text-secondary dark:text-dark-text-secondary">
                        {transaction.category}
                      </td>
                      <td className="py-4 text-light-text-secondary dark:text-dark-text-secondary">
                        {transaction.date}
                      </td>
                      <td className="py-4 text-right font-semibold text-light-text-primary dark:text-dark-text-primary">
                        ₦{transaction.amount.toLocaleString()}
                      </td>
                      <td className="py-4 text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            transaction.status === 'SUCCESS'
                              ? 'bg-success-500/10 text-success-500'
                              : 'bg-warning-500/10 text-warning-500'
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SolidDashboardLayout>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background flex items-center justify-center">
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-8">
          <p className="text-error-500">Failed to load dashboard. Please try again.</p>
        </div>
      </div>
    );
  }
}
