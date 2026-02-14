import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';

/**
 * KOMPLEET Dashboard - Financial Health Overview
 */
export default async function DashboardPage() {
  const supabase = await createServerClient();
  await requireServerUser(supabase);

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
          Financial Health Overview
        </h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Welcome back. Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Total Revenue (MTD)</span>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              +{kpiData.revenueChange}%
            </span>
          </div>
          <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            &#x20A6;{kpiData.totalRevenue.toLocaleString()}
          </div>
        </div>

        {/* Estimated Tax Owed */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Estimated Tax Owed</span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
              Due in {kpiData.taxDueIn}d
            </span>
          </div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            &#x20A6;{kpiData.estimatedTax.toLocaleString()}
          </div>
        </div>

        {/* Outstanding Invoices */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Outstanding Invoices</span>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
              {kpiData.pendingCount} Pending
            </span>
          </div>
          <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            &#x20A6;{kpiData.outstandingInvoices.toLocaleString()}
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
                    <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                      {transaction.description}
                    </span>
                  </td>
                  <td className="py-4 text-light-text-secondary dark:text-dark-text-secondary">
                    {transaction.category}
                  </td>
                  <td className="py-4 text-light-text-secondary dark:text-dark-text-secondary">
                    {transaction.date}
                  </td>
                  <td className="py-4 text-right font-semibold text-light-text-primary dark:text-dark-text-primary">
                    &#x20A6;{transaction.amount.toLocaleString()}
                  </td>
                  <td className="py-4 text-right">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        transaction.status === 'SUCCESS'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
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
  );
}
