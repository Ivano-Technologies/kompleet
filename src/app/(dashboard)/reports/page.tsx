'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
  });
  // Theme is now handled by ThemeProvider and Tailwind dark: classes

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/transactions?limit=10000');
      const data = await response.json();

      if (response.ok) {
        const transactions = data.transactions || [];
        const revenue = transactions
          .filter((t: any) => t.category?.category_type === 'income')
          .reduce((sum: number, t: any) => sum + t.amount, 0);
        const expenses = transactions
          .filter((t: any) => t.category?.category_type === 'expense')
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        setStats({
          totalTransactions: transactions.length,
          totalRevenue: revenue,
          totalExpenses: expenses,
          netIncome: revenue - expenses,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Theme classes now use Tailwind dark: variants

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Financial Reports</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {new Date().toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="text-light-text-tertiary dark:text-dark-text-tertiary">-</span>
              <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <button className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg px-4 py-2 text-light-text-primary dark:text-dark-text-primary hover:border-primary-500 transition-colors text-sm font-medium">
              + Export Report
            </button>
          </div>
        </div>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Analyze your business metrics and growth
        </p>
      </div>

      {/* Quick Stats - KPI Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-success-500/10 flex items-center justify-center">
              <span className="material-icons text-success-500">trending_up</span>
            </div>
            <div className="flex items-center gap-1 text-success-500 text-sm font-semibold">
              <span className="material-icons text-xs">arrow_upward</span>
              <span>+8%</span>
            </div>
          </div>
          <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-2">Total Revenue (MTD)</div>
          <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {formatCurrency(stats.totalRevenue)}
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-error-500/10 flex items-center justify-center">
              <span className="material-icons text-error-500">trending_down</span>
            </div>
            <div className="flex items-center gap-1 text-error-500 text-sm font-semibold">
              <span className="material-icons text-xs">arrow_downward</span>
              <span>-3.2%</span>
            </div>
          </div>
          <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-2">Total Outflow (MTD)</div>
          <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {formatCurrency(stats.totalExpenses)}
          </div>
        </div>

        {/* Estimated Tax Owed */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-warning-500/10 flex items-center justify-center">
              <span className="material-icons text-warning-500">account_balance</span>
            </div>
            <div className="flex items-center gap-1 text-warning-500 text-sm font-semibold">
              <span>Due in 14d</span>
            </div>
          </div>
          <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-2">Estimated Tax Liability</div>
          <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {formatCurrency(stats.netIncome * 0.3)}
          </div>
        </div>

        {/* Net Income */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <span className="material-icons text-primary-500">show_chart</span>
            </div>
            <div className="flex items-center gap-1 text-primary-500 text-sm font-semibold">
              <span className="material-icons text-xs">arrow_upward</span>
              <span>+4%</span>
            </div>
          </div>
          <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mb-2">Close Tax Rate</div>
          <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            1.24%
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profit & Loss Statement */}
        <Link
          href="/reports/profit-loss"
          className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-8 hover:border-primary-500 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="w-16 h-16 rounded-xl bg-primary-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-4xl">📊</span>
            </div>
            <div className="bg-success-500/10 text-success-500 text-xs font-bold px-3 py-1 rounded-full uppercase">
              Income Statement
            </div>
          </div>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-3">Profit & Loss Statement</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6 leading-relaxed">
            View your revenue and expenses over a specific period. Essential for tax filing and
            business performance analysis.
          </p>
          <div className="space-y-3">
            {['Revenue breakdown by category', 'Expense categorization', 'Taxable income calculation', 'Profit margin analysis'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-lg bg-success-500/10 flex items-center justify-center">
                  <span className="material-icons text-success-500 text-xs">check</span>
                </div>
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center text-primary-500 font-semibold group-hover:gap-3 gap-2 transition-all">
            <span>Generate Report</span>
            <span className="material-icons">arrow_forward</span>
          </div>
        </Link>

        {/* Balance Sheet */}
        <Link
          href="/reports/balance-sheet"
          className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-8 hover:border-primary-500 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="w-16 h-16 rounded-xl bg-warning-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-4xl">💼</span>
            </div>
            <div className="bg-warning-500/10 text-warning-500 text-xs font-bold px-3 py-1 rounded-full uppercase">
              Financial Position
            </div>
          </div>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-3">Balance Sheet</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6 leading-relaxed">
            Snapshot of your business's financial position at a specific point in time. Shows assets,
            liabilities, and equity.
          </p>
          <div className="space-y-3">
            {['Assets overview', 'Liabilities tracking', 'Equity calculation', 'Financial health metrics'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-warning-500/10 flex items-center justify-center">
                  <span className="material-icons text-warning-500 text-xs">check</span>
                </div>
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center text-primary-500 font-semibold group-hover:gap-3 gap-2 transition-all">
            <span>Generate Report</span>
            <span className="material-icons">arrow_forward</span>
          </div>
        </Link>

        {/* Cash Flow Statement */}
        <Link
          href="/reports/cash-flow"
          className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-8 hover:border-primary-500 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="w-16 h-16 rounded-xl bg-success-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-4xl">💰</span>
            </div>
            <div className="bg-primary-500/10 text-primary-500 text-xs font-bold px-3 py-1 rounded-full uppercase">
              Cash Analysis
            </div>
          </div>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-3">Cash Flow Statement</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6 leading-relaxed">
            Track how cash moves in and out of your business. Critical for understanding liquidity
            and operational efficiency.
          </p>
          <div className="space-y-3">
            {['Operating activities', 'Investing activities', 'Financing activities', 'Net cash position'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-500/10 flex items-center justify-center">
                  <span className="material-icons text-primary-500 text-xs">check</span>
                </div>
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center text-primary-500 font-semibold group-hover:gap-3 gap-2 transition-all">
            <span>Generate Report</span>
            <span className="material-icons">arrow_forward</span>
          </div>
        </Link>

        {/* Tax Summary Report */}
        <Link
          href="/reports/tax-summary"
          className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-8 hover:border-primary-500 transition-all duration-200 group"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="w-16 h-16 rounded-xl bg-error-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-4xl">📋</span>
            </div>
            <div className="bg-error-500/10 text-error-500 text-xs font-bold px-3 py-1 rounded-full uppercase">
              Tax Compliance
            </div>
          </div>
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-3">Tax Summary Report</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6 leading-relaxed">
            Comprehensive overview of your tax obligations including VAT, WHT, and CIT. Ready for
            FIRS and LIRS submission.
          </p>
          <div className="space-y-3">
            {['VAT calculations', 'Withholding tax summary', 'CIT estimates', 'Filing deadlines'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-error-500/10 flex items-center justify-center">
                  <span className="material-icons text-error-500 text-xs">check</span>
                </div>
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center text-primary-500 font-semibold group-hover:gap-3 gap-2 transition-all">
            <span>Generate Report</span>
            <span className="material-icons">arrow_forward</span>
          </div>
        </Link>
      </div>


    </div>
  );
}
