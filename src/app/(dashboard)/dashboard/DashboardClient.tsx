"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Download,
  FileText,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface KpiData {
  totalRevenue: number;
  revenueChange: number;
  estimatedTax: number;
  taxDueDate: string;
  outstandingInvoices: number;
  pendingCount: number;
  netProfit: number;
  profitChange: number;
}

interface RevenuePoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface TaxItem {
  name: string;
  value: number;
  color: string;
}

interface Transaction {
  id: string;
  desc: string;
  amount: number;
  type: string;
  date: string;
  status: string;
}

interface DashboardClientProps {
  kpiData: KpiData;
  revenueData: RevenuePoint[];
  taxBreakdown: TaxItem[];
  recentTransactions: Transaction[];
}

function formatNaira(val: number) {
  const abs = Math.abs(val);
  if (abs >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return val.toLocaleString();
}

export default function DashboardClient({
  kpiData,
  revenueData,
  taxBreakdown,
  recentTransactions,
}: DashboardClientProps) {
  const kpis = [
    {
      label: "Total Revenue",
      value: `₦${formatNaira(kpiData.totalRevenue)}`,
      change: `+${kpiData.revenueChange}%`,
      up: true,
      icon: TrendingUp,
    },
    {
      label: "Outstanding Invoices",
      value: `₦${formatNaira(kpiData.outstandingInvoices)}`,
      change: `${kpiData.pendingCount} pending`,
      up: false,
      icon: FileText,
    },
    {
      label: "Tax Obligations",
      value: `₦${formatNaira(kpiData.estimatedTax)}`,
      change: `Due ${kpiData.taxDueDate}`,
      up: false,
      icon: Wallet,
    },
    {
      label: "Net Profit",
      value: `₦${formatNaira(kpiData.netProfit)}`,
      change: `+${kpiData.profitChange}%`,
      up: true,
      icon: ArrowUpRight,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-1 dark:text-dark-text-1">
            Dashboard
          </h1>
          <p className="text-sm text-text-2 dark:text-dark-text-2 mt-1">
            Financial overview for February 2026
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm px-3 py-2 hidden sm:flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <Link
            href="/invoices"
            className="btn-primary text-sm px-3 py-2 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Invoice
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-5 rounded-xl border border-border dark:border-dark-border bg-surface dark:bg-dark-surface"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-text-2 dark:text-dark-text-2">
                  {kpi.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold text-text-1 dark:text-dark-text-1 mb-1">
                {kpi.value}
              </div>
              <div
                className={`text-xs font-medium flex items-center gap-1 ${
                  kpi.up
                    ? "text-green-600 dark:text-green-400"
                    : "text-text-3 dark:text-dark-text-3"
                }`}
              >
                {kpi.up && <ArrowUpRight className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue vs Expenses Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border dark:border-dark-border bg-surface dark:bg-dark-surface">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-sm text-text-1 dark:text-dark-text-1">
                Revenue vs Expenses
              </h3>
              <p className="text-xs text-text-3 dark:text-dark-text-3 mt-0.5">
                Last 8 months
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#166534" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#166534" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-light-border dark:stroke-dark-border"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  className="fill-light-text-tertiary dark:fill-dark-text-tertiary"
                />
                <YAxis
                  tickFormatter={(v) => `₦${formatNaira(v)}`}
                  tick={{ fontSize: 12 }}
                  className="fill-light-text-tertiary dark:fill-dark-text-tertiary"
                />
                <Tooltip
                  formatter={(v) => [`₦${Number(v).toLocaleString()}`, ""]}
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, #fff)",
                    border: "1px solid var(--tooltip-border, #e5e7eb)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#166534"
                  fill="url(#revGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  fill="transparent"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tax Breakdown */}
        <div className="p-5 rounded-xl border border-border dark:border-dark-border bg-surface dark:bg-dark-surface">
          <h3 className="font-semibold text-sm text-text-1 dark:text-dark-text-1 mb-1">
            Tax Breakdown
          </h3>
          <p className="text-xs text-text-3 dark:text-dark-text-3 mb-4">
            Current quarter obligations
          </p>
          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taxBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {taxBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`₦${Number(v).toLocaleString()}`, ""]}
                  contentStyle={{
                    backgroundColor: "var(--tooltip-bg, #fff)",
                    border: "1px solid var(--tooltip-border, #e5e7eb)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {taxBreakdown.map((t) => (
              <div
                key={t.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-text-2 dark:text-dark-text-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.name}
                </span>
                <span className="font-medium text-text-1 dark:text-dark-text-1">
                  ₦{t.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-border dark:border-dark-border bg-surface dark:bg-dark-surface">
        <div className="flex items-center justify-between p-5 border-b border-border dark:border-dark-border">
          <div>
            <h3 className="font-semibold text-sm text-text-1 dark:text-dark-text-1">
              Recent Transactions
            </h3>
            <p className="text-xs text-text-3 dark:text-dark-text-3 mt-0.5">
              Latest financial activity
            </p>
          </div>
          <Link
            href="/transactions"
            className="btn-secondary text-xs px-3 py-1.5"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-dark-border">
                <th className="text-left font-medium text-text-3 dark:text-dark-text-3 px-5 py-3 text-xs">
                  Transaction
                </th>
                <th className="text-left font-medium text-text-3 dark:text-dark-text-3 px-5 py-3 text-xs hidden sm:table-cell">
                  Date
                </th>
                <th className="text-left font-medium text-text-3 dark:text-dark-text-3 px-5 py-3 text-xs hidden md:table-cell">
                  Status
                </th>
                <th className="text-right font-medium text-text-3 dark:text-dark-text-3 px-5 py-3 text-xs">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="border-b border-border/50 dark:border-dark-border/50 last:border-0 hover:bg-surface-2 dark:hover:bg-dark-surface-hover transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-sm text-text-1 dark:text-dark-text-1">
                      {txn.desc}
                    </div>
                    <div className="text-xs text-text-3 dark:text-dark-text-3 mt-0.5">
                      {txn.id}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-text-2 dark:text-dark-text-2 text-xs hidden sm:table-cell">
                    {txn.date}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        txn.status === "completed"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </td>
                  <td
                    className={`px-5 py-3.5 text-right font-medium text-sm ${
                      txn.amount > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-text-1 dark:text-dark-text-1"
                    }`}
                  >
                    {txn.amount > 0 ? "+" : ""}₦
                    {Math.abs(txn.amount).toLocaleString()}
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
