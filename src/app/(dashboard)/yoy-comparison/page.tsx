'use client';

import React, { useEffect, useState } from 'react';

// Force dynamic rendering to avoid static generation errors with context
export const dynamic = 'force-dynamic';
import { useYear } from '@/contexts/year-context';
import { YearSelector } from '@/components/year-selector';

interface YoYData {
  income: { current: number; previous: number; change: number; changePercent: number };
  expenses: { current: number; previous: number; change: number; changePercent: number };
  tax: { current: number; previous: number; change: number; changePercent: number };
  netIncome: { current: number; previous: number; change: number; changePercent: number };
}

export default function YoYComparisonPage() {
  const { selectedYear } = useYear();
  const [data, setData] = useState<YoYData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchYoYData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/analytics/yoy/summary?year=${selectedYear}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch YoY data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchYoYData();
  }, [selectedYear]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-green-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Year-over-Year Comparison</h1>
        <p className="mt-2 text-gray-600">No data available for comparison.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getChangeColor = (change: number, isExpense: boolean = false) => {
    // For expenses, negative change is good (reduction)
    // For income/net, positive change is good (growth)
    const isPositive = isExpense ? change < 0 : change > 0;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const getChangeBgColor = (change: number, isExpense: boolean = false) => {
    const isPositive = isExpense ? change < 0 : change > 0;
    return isPositive ? 'bg-green-50' : 'bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Year-over-Year Comparison</h1>
          <p className="mt-1 text-sm text-gray-600">
            Comparing {selectedYear} vs {selectedYear - 1}
          </p>
        </div>
        <YearSelector />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Income Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Total Income</h3>
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.income.current)}</p>
            <p className="mt-1 text-sm text-gray-500">vs {formatCurrency(data.income.previous)}</p>
          </div>
          <div className={`mt-4 flex items-center gap-2 rounded-md p-2 ${getChangeBgColor(data.income.change)}`}>
            <span className={`text-sm font-semibold ${getChangeColor(data.income.change)}`}>
              {formatPercent(data.income.changePercent)}
            </span>
            <span className="text-xs text-gray-600">vs last year</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Total Expenses</h3>
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.expenses.current)}</p>
            <p className="mt-1 text-sm text-gray-500">vs {formatCurrency(data.expenses.previous)}</p>
          </div>
          <div className={`mt-4 flex items-center gap-2 rounded-md p-2 ${getChangeBgColor(data.expenses.change, true)}`}>
            <span className={`text-sm font-semibold ${getChangeColor(data.expenses.change, true)}`}>
              {formatPercent(data.expenses.changePercent)}
            </span>
            <span className="text-xs text-gray-600">vs last year</span>
          </div>
        </div>

        {/* Tax Liability Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Tax Liability</h3>
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.tax.current)}</p>
            <p className="mt-1 text-sm text-gray-500">vs {formatCurrency(data.tax.previous)}</p>
          </div>
          <div className={`mt-4 flex items-center gap-2 rounded-md p-2 ${getChangeBgColor(data.tax.change, true)}`}>
            <span className={`text-sm font-semibold ${getChangeColor(data.tax.change, true)}`}>
              {formatPercent(data.tax.changePercent)}
            </span>
            <span className="text-xs text-gray-600">vs last year</span>
          </div>
        </div>

        {/* Net Income Card */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Net Income</h3>
            <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.netIncome.current)}</p>
            <p className="mt-1 text-sm text-gray-500">vs {formatCurrency(data.netIncome.previous)}</p>
          </div>
          <div className={`mt-4 flex items-center gap-2 rounded-md p-2 ${getChangeBgColor(data.netIncome.change)}`}>
            <span className={`text-sm font-semibold ${getChangeColor(data.netIncome.change)}`}>
              {formatPercent(data.netIncome.changePercent)}
            </span>
            <span className="text-xs text-gray-600">vs last year</span>
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">Detailed Comparison</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Metric
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {selectedYear - 1}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {selectedYear}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Change
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  % Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">Total Income</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                  {formatCurrency(data.income.previous)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                  {formatCurrency(data.income.current)}
                </td>
                <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${getChangeColor(data.income.change)}`}>
                  {formatCurrency(data.income.change)}
                </td>
                <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${getChangeColor(data.income.change)}`}>
                  {formatPercent(data.income.changePercent)}
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">Total Expenses</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                  {formatCurrency(data.expenses.previous)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                  {formatCurrency(data.expenses.current)}
                </td>
                <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${getChangeColor(data.expenses.change, true)}`}>
                  {formatCurrency(data.expenses.change)}
                </td>
                <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${getChangeColor(data.expenses.change, true)}`}>
                  {formatPercent(data.expenses.changePercent)}
                </td>
              </tr>
              <tr>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">Tax Liability</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                  {formatCurrency(data.tax.previous)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                  {formatCurrency(data.tax.current)}
                </td>
                <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${getChangeColor(data.tax.change, true)}`}>
                  {formatCurrency(data.tax.change)}
                </td>
                <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${getChangeColor(data.tax.change, true)}`}>
                  {formatPercent(data.tax.changePercent)}
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">Net Income</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  {formatCurrency(data.netIncome.previous)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-gray-900">
                  {formatCurrency(data.netIncome.current)}
                </td>
                <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-bold ${getChangeColor(data.netIncome.change)}`}>
                  {formatCurrency(data.netIncome.change)}
                </td>
                <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-bold ${getChangeColor(data.netIncome.change)}`}>
                  {formatPercent(data.netIncome.changePercent)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-8 rounded-lg bg-blue-50 p-6">
        <h3 className="text-lg font-semibold text-blue-900">Key Insights</h3>
        <ul className="mt-4 space-y-2">
          {data.income.change > 0 && (
            <li className="flex items-start gap-2 text-sm text-blue-800">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your income increased by {formatPercent(data.income.changePercent)} compared to last year.</span>
            </li>
          )}
          {data.expenses.change < 0 && (
            <li className="flex items-start gap-2 text-sm text-blue-800">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Great job! You reduced expenses by {formatPercent(Math.abs(data.expenses.changePercent))}.</span>
            </li>
          )}
          {data.tax.change < 0 && (
            <li className="flex items-start gap-2 text-sm text-blue-800">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your tax liability decreased by {formatPercent(Math.abs(data.tax.changePercent))}.</span>
            </li>
          )}
          {data.netIncome.change > 0 && (
            <li className="flex items-start gap-2 text-sm text-blue-800">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your net income grew by {formatPercent(data.netIncome.changePercent)} year-over-year.</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
