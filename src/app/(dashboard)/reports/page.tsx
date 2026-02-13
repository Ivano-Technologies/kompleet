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
  const [isDarkMode, setIsDarkMode] = useState(true);

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

  const bgClass = isDarkMode ? 'bg-dark-background' : 'bg-light-background';
  const surfaceClass = isDarkMode ? 'bg-dark-surface border-dark-border' : 'bg-white border-gray-200';
  const textPrimaryClass = isDarkMode ? 'text-dark-text-primary' : 'text-gray-900';
  const textSecondaryClass = isDarkMode ? 'text-dark-text-secondary' : 'text-gray-600';
  const textTertiaryClass = isDarkMode ? 'text-dark-text-tertiary' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bgClass} p-8`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className={`text-3xl font-bold ${textPrimaryClass}`}>Financial Reports</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${textSecondaryClass}`}>
                {new Date().toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className={textTertiaryClass}>-</span>
              <span className={`text-sm ${textSecondaryClass}`}>
                {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <button className={`${surfaceClass} border rounded-lg px-4 py-2 ${textPrimaryClass} hover:border-primary-500 transition-colors text-sm font-medium`}>
              + Export Report
            </button>
          </div>
        </div>
        <p className={`${textSecondaryClass}`}>
          Analyze your business metrics and growth
        </p>
      </div>

      {/* Quick Stats - KPI Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className={`${surfaceClass} border rounded-xl p-6`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${isDarkMode ? 'bg-success-500/10' : 'bg-green-50'} flex items-center justify-center`}>
              <span className="material-icons text-success-500">trending_up</span>
            </div>
            <div className="flex items-center gap-1 text-success-500 text-sm font-semibold">
              <span className="material-icons text-xs">arrow_upward</span>
              <span>+8%</span>
            </div>
          </div>
          <div className={`text-sm ${textTertiaryClass} mb-2`}>Total Revenue (MTD)</div>
          <div className={`text-3xl font-bold ${textPrimaryClass}`}>
            {formatCurrency(stats.totalRevenue)}
          </div>
        </div>

        {/* Total Expenses */}
        <div className={`${surfaceClass} border rounded-xl p-6`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${isDarkMode ? 'bg-error-500/10' : 'bg-red-50'} flex items-center justify-center`}>
              <span className="material-icons text-error-500">trending_down</span>
            </div>
            <div className="flex items-center gap-1 text-error-500 text-sm font-semibold">
              <span className="material-icons text-xs">arrow_downward</span>
              <span>-3.2%</span>
            </div>
          </div>
          <div className={`text-sm ${textTertiaryClass} mb-2`}>Total Outflow (MTD)</div>
          <div className={`text-3xl font-bold ${textPrimaryClass}`}>
            {formatCurrency(stats.totalExpenses)}
          </div>
        </div>

        {/* Estimated Tax Owed */}
        <div className={`${surfaceClass} border rounded-xl p-6`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${isDarkMode ? 'bg-warning-500/10' : 'bg-yellow-50'} flex items-center justify-center`}>
              <span className="material-icons text-warning-500">account_balance</span>
            </div>
            <div className="flex items-center gap-1 text-warning-500 text-sm font-semibold">
              <span>Due in 14d</span>
            </div>
          </div>
          <div className={`text-sm ${textTertiaryClass} mb-2`}>Estimated Tax Liability</div>
          <div className={`text-3xl font-bold ${textPrimaryClass}`}>
            {formatCurrency(stats.netIncome * 0.3)}
          </div>
        </div>

        {/* Net Income */}
        <div className={`${surfaceClass} border rounded-xl p-6`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-lg ${isDarkMode ? 'bg-primary-500/10' : 'bg-blue-50'} flex items-center justify-center`}>
              <span className="material-icons text-primary-500">show_chart</span>
            </div>
            <div className="flex items-center gap-1 text-primary-500 text-sm font-semibold">
              <span className="material-icons text-xs">arrow_upward</span>
              <span>+4%</span>
            </div>
          </div>
          <div className={`text-sm ${textTertiaryClass} mb-2`}>Close Tax Rate</div>
          <div className={`text-3xl font-bold ${textPrimaryClass}`}>
            1.24%
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profit & Loss Statement */}
        <Link
          href="/reports/profit-loss"
          className={`${surfaceClass} border rounded-xl p-8 hover:border-primary-500 transition-all duration-200 group`}
        >
          <div className="flex items-start justify-between mb-6">
            <div className={`w-16 h-16 rounded-xl ${isDarkMode ? 'bg-primary-500/10' : 'bg-green-50'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <span className="text-4xl">📊</span>
            </div>
            <div className={`${isDarkMode ? 'bg-success-500/10 text-success-500' : 'bg-green-100 text-green-700'} text-xs font-bold px-3 py-1 rounded-full uppercase`}>
              Income Statement
            </div>
          </div>
          <h2 className={`text-2xl font-bold ${textPrimaryClass} mb-3`}>Profit & Loss Statement</h2>
          <p className={`${textSecondaryClass} mb-6 leading-relaxed`}>
            View your revenue and expenses over a specific period. Essential for tax filing and
            business performance analysis.
          </p>
          <div className="space-y-3">
            {['Revenue breakdown by category', 'Expense categorization', 'Taxable income calculation', 'Profit margin analysis'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full ${isDarkMode ? 'bg-success-500/10' : 'bg-green-50'} flex items-center justify-center`}>
                  <span className="material-icons text-success-500 text-xs">check</span>
                </div>
                <span className={`text-sm ${textSecondaryClass}`}>{item}</span>
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
          className={`${surfaceClass} border rounded-xl p-8 hover:border-primary-500 transition-all duration-200 group`}
        >
          <div className="flex items-start justify-between mb-6">
            <div className={`w-16 h-16 rounded-xl ${isDarkMode ? 'bg-warning-500/10' : 'bg-blue-50'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <span className="text-4xl">💼</span>
            </div>
            <div className={`${isDarkMode ? 'bg-warning-500/10 text-warning-500' : 'bg-blue-100 text-blue-700'} text-xs font-bold px-3 py-1 rounded-full uppercase`}>
              Financial Position
            </div>
          </div>
          <h2 className={`text-2xl font-bold ${textPrimaryClass} mb-3`}>Balance Sheet</h2>
          <p className={`${textSecondaryClass} mb-6 leading-relaxed`}>
            Snapshot of your business's financial position at a specific point in time. Shows assets,
            liabilities, and equity.
          </p>
          <div className="space-y-3">
            {['Assets overview', 'Liabilities tracking', 'Equity calculation', 'Financial health metrics'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full ${isDarkMode ? 'bg-warning-500/10' : 'bg-blue-50'} flex items-center justify-center`}>
                  <span className="material-icons text-warning-500 text-xs">check</span>
                </div>
                <span className={`text-sm ${textSecondaryClass}`}>{item}</span>
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
          className={`${surfaceClass} border rounded-xl p-8 hover:border-primary-500 transition-all duration-200 group`}
        >
          <div className="flex items-start justify-between mb-6">
            <div className={`w-16 h-16 rounded-xl ${isDarkMode ? 'bg-success-500/10' : 'bg-purple-50'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <span className="text-4xl">💰</span>
            </div>
            <div className={`${isDarkMode ? 'bg-primary-500/10 text-primary-500' : 'bg-purple-100 text-purple-700'} text-xs font-bold px-3 py-1 rounded-full uppercase`}>
              Cash Analysis
            </div>
          </div>
          <h2 className={`text-2xl font-bold ${textPrimaryClass} mb-3`}>Cash Flow Statement</h2>
          <p className={`${textSecondaryClass} mb-6 leading-relaxed`}>
            Track how cash moves in and out of your business. Critical for understanding liquidity
            and operational efficiency.
          </p>
          <div className="space-y-3">
            {['Operating activities', 'Investing activities', 'Financing activities', 'Net cash position'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full ${isDarkMode ? 'bg-primary-500/10' : 'bg-purple-50'} flex items-center justify-center`}>
                  <span className="material-icons text-primary-500 text-xs">check</span>
                </div>
                <span className={`text-sm ${textSecondaryClass}`}>{item}</span>
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
          className={`${surfaceClass} border rounded-xl p-8 hover:border-primary-500 transition-all duration-200 group`}
        >
          <div className="flex items-start justify-between mb-6">
            <div className={`w-16 h-16 rounded-xl ${isDarkMode ? 'bg-error-500/10' : 'bg-red-50'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <span className="text-4xl">📋</span>
            </div>
            <div className={`${isDarkMode ? 'bg-error-500/10 text-error-500' : 'bg-red-100 text-red-700'} text-xs font-bold px-3 py-1 rounded-full uppercase`}>
              Tax Compliance
            </div>
          </div>
          <h2 className={`text-2xl font-bold ${textPrimaryClass} mb-3`}>Tax Summary Report</h2>
          <p className={`${textSecondaryClass} mb-6 leading-relaxed`}>
            Comprehensive overview of your tax obligations including VAT, WHT, and CIT. Ready for
            FIRS and LIRS submission.
          </p>
          <div className="space-y-3">
            {['VAT calculations', 'Withholding tax summary', 'CIT estimates', 'Filing deadlines'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full ${isDarkMode ? 'bg-error-500/10' : 'bg-red-50'} flex items-center justify-center`}>
                  <span className="material-icons text-error-500 text-xs">check</span>
                </div>
                <span className={`text-sm ${textSecondaryClass}`}>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center text-primary-500 font-semibold group-hover:gap-3 gap-2 transition-all">
            <span>Generate Report</span>
            <span className="material-icons">arrow_forward</span>
          </div>
        </Link>
      </div>

      {/* Theme Toggle Button (Floating) */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full ${surfaceClass} border shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-50`}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span className="material-icons text-primary-500">
          {isDarkMode ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
    </div>
  );
}
