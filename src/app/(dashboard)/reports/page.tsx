'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Building2,
  LineChart,
  ArrowRight,
  Download,
  FileBarChart,
  Receipt,
  Wallet,
  PieChart,
} from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
  });

  const [dateRange] = useState(() => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      start: today.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }),
      end: futureDate.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  });

  const fetchStats = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const kpis = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: '+8%',
      up: true,
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Total Outflow',
      value: formatCurrency(stats.totalExpenses),
      change: '-3.2%',
      up: false,
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Tax Liability',
      value: formatCurrency(stats.netIncome * 0.3),
      change: 'Due in 14d',
      up: false,
      icon: Building2,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'Close Tax Rate',
      value: '1.24%',
      change: '+4%',
      up: true,
      icon: LineChart,
      color: 'text-primary-500',
      bg: 'bg-primary-500/10',
    },
  ];

  const reports = [
    {
      title: 'Profit & Loss Statement',
      desc: 'Revenue and expenses over a specific period. Essential for tax filing and business performance.',
      href: '/reports/profit-loss',
      icon: FileBarChart,
      badge: 'Income Statement',
      badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      items: ['Revenue breakdown by category', 'Expense categorization', 'Taxable income calculation', 'Profit margin analysis'],
    },
    {
      title: 'Balance Sheet',
      desc: 'Snapshot of your financial position — assets, liabilities, and equity at a point in time.',
      href: '/reports/balance-sheet',
      icon: Wallet,
      badge: 'Financial Position',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      items: ['Assets overview', 'Liabilities tracking', 'Equity calculation', 'Financial health metrics'],
    },
    {
      title: 'Cash Flow Statement',
      desc: 'Track how cash moves in and out of your business. Critical for understanding liquidity.',
      href: '/reports/cash-flow',
      icon: PieChart,
      badge: 'Cash Analysis',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      items: ['Operating activities', 'Investing activities', 'Financing activities', 'Net cash position'],
    },
    {
      title: 'Tax Summary Report',
      desc: 'Comprehensive overview of tax obligations — VAT, WHT, and CIT. Ready for NRS/JTB submission.',
      href: '/reports/tax-summary',
      icon: Receipt,
      badge: 'Tax Compliance',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      items: ['VAT calculations', 'Withholding tax summary', 'CIT estimates', 'Filing deadlines'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Financial Reports
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
            {dateRange.start} — {dateRange.end}
          </p>
        </div>
        <button className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5 self-start">
          <Download className="w-3.5 h-3.5" /> Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {kpi.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
                {kpi.value}
              </div>
              <div
                className={`text-xs font-medium flex items-center gap-1 ${
                  kpi.up
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-light-text-tertiary dark:text-dark-text-tertiary'
                }`}
              >
                {kpi.up && <ArrowUp className="w-3 h-3" />}
                {!kpi.up && kpi.change.startsWith('-') && <ArrowDown className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.title}
              href={report.href}
              className="p-6 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:border-primary-500 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-primary-500" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${report.badgeColor}`}>
                  {report.badge}
                </span>
              </div>
              <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
                {report.title}
              </h2>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4 leading-relaxed">
                {report.desc}
              </p>
              <ul className="space-y-1.5 mb-5">
                {report.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                    <span className="w-1 h-1 rounded-full bg-primary-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-center text-primary-500 text-sm font-medium group-hover:gap-2.5 gap-1.5 transition-all">
                <span>Generate Report</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
