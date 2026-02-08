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

  useEffect(() => {
    // Fetch quick stats
    fetchStats();
  }, []);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600 mt-1">
          Generate professional financial statements for tax compliance and business insights
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6">
          <div className="text-sm text-gray-600 font-medium">Total Transactions</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTransactions}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-6">
          <div className="text-sm text-green-700 font-medium">Total Revenue</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {formatCurrency(stats.totalRevenue)}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-6">
          <div className="text-sm text-red-700 font-medium">Total Expenses</div>
          <div className="text-3xl font-bold text-red-900 mt-2">
            {formatCurrency(stats.totalExpenses)}
          </div>
        </div>
        <div className={`rounded-lg p-6 ${stats.netIncome >= 0 ? 'bg-blue-50' : 'bg-yellow-50'}`}>
          <div className={`text-sm font-medium ${stats.netIncome >= 0 ? 'text-blue-700' : 'text-yellow-700'}`}>
            Net {stats.netIncome >= 0 ? 'Profit' : 'Loss'}
          </div>
          <div className={`text-3xl font-bold mt-2 ${stats.netIncome >= 0 ? 'text-blue-900' : 'text-yellow-900'}`}>
            {formatCurrency(Math.abs(stats.netIncome))}
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profit & Loss Statement */}
        <Link
          href="/reports/profit-loss"
          className="bg-white rounded-lg p-8 hover:shadow-md transition-shadow border-2 border-transparent hover:border-green-500"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-5xl">📊</div>
            <div className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
              Income Statement
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profit & Loss Statement</h2>
          <p className="text-gray-600 mb-4">
            View your revenue and expenses over a specific period. Essential for tax filing and
            business performance analysis.
          </p>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Revenue breakdown by category</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Expense categorization</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Taxable income calculation</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Profit margin analysis</span>
            </div>
          </div>
          <div className="mt-6 flex items-center text-green-600 font-semibold">
            Generate Report
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Balance Sheet */}
        <Link
          href="/reports/balance-sheet"
          className="bg-white rounded-lg p-8 hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-5xl">📈</div>
            <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
              Financial Position
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Balance Sheet</h2>
          <p className="text-gray-600 mb-4">
            Snapshot of your financial position at a specific date. Shows assets, liabilities, and
            equity for comprehensive financial health assessment.
          </p>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Current & non-current assets</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Liabilities breakdown</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Owner's equity calculation</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Financial ratios (current ratio, debt-to-equity)</span>
            </div>
          </div>
          <div className="mt-6 flex items-center text-blue-600 font-semibold">
            Generate Report
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          💡 About Financial Statements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-semibold mb-2">Profit & Loss Statement</h4>
            <p>
              Also known as Income Statement, shows your business performance over a period (month,
              quarter, year). Required for tax filing under the Nigeria Tax Act 2025.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Balance Sheet</h4>
            <p>
              Shows your financial position at a specific point in time. Essential for loan
              applications, investor presentations, and understanding your business's net worth.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 flex gap-4">
        <Link
          href="/transactions"
          className="text-green-600 hover:text-green-700 font-medium"
        >
          ← View Transactions
        </Link>
        <Link
          href="/categories"
          className="text-green-600 hover:text-green-700 font-medium"
        >
          Manage Categories →
        </Link>
      </div>
    </div>
  );
}
