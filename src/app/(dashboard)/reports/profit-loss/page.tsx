'use client';

import { useState } from 'react';
import Link from 'next/link';

interface LineItem {
  category: string;
  amount: number;
  count: number;
  taxTreatment?: string;
}

interface ProfitLossStatement {
  period: { start: string; end: string };
  revenue: { items: LineItem[]; total: number };
  expenses: { items: LineItem[]; total: number };
  netIncome: number;
  taxableIncome: number;
}

export default function ProfitLossPage() {
  const [statement, setStatement] = useState<ProfitLossStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();

      if (response.ok) {
        setStatement(data.statement);
      } else {
        alert(data.error || 'Failed to generate statement');
      }
    } catch (error) {
      console.error('Error generating statement:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const profitMargin = statement
    ? statement.revenue.total > 0
      ? ((statement.netIncome / statement.revenue.total) * 100).toFixed(2)
      : '0.00'
    : '0.00';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/reports"
          className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
        >
          ← Back to Reports
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Profit & Loss Statement</h1>
        <p className="text-gray-600 mt-1">
          Income Statement following Nigerian accounting standards
        </p>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Period</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Statement'}
            </button>
          </div>
        </div>
      </div>

      {/* Statement */}
      {statement && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-gray-900 pb-4">
            <h2 className="text-2xl font-bold text-gray-900">PROFIT & LOSS STATEMENT</h2>
            <p className="text-gray-600 mt-2">
              For the period from {formatDate(statement.period.start)} to{' '}
              {formatDate(statement.period.end)}
            </p>
          </div>

          {/* Revenue Section */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              REVENUE
            </h3>
            {statement.revenue.items.length > 0 ? (
              <table className="w-full">
                <tbody>
                  {statement.revenue.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-2 text-gray-700">
                        {item.category}
                        <span className="text-xs text-gray-500 ml-2">
                          ({item.count} transaction{item.count !== 1 ? 's' : ''})
                        </span>
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-900 font-bold">
                    <td className="py-3 text-gray-900">TOTAL REVENUE</td>
                    <td className="py-3 text-right text-gray-900">
                      {formatCurrency(statement.revenue.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 italic py-2">No revenue transactions in this period</p>
            )}
          </div>

          {/* Expenses Section */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">
              EXPENSES
            </h3>
            {statement.expenses.items.length > 0 ? (
              <table className="w-full">
                <tbody>
                  {statement.expenses.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-2 text-gray-700">
                        {item.category}
                        <span className="text-xs text-gray-500 ml-2">
                          ({item.count} transaction{item.count !== 1 ? 's' : ''})
                        </span>
                        {item.taxTreatment === 'non_deductible' && (
                          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Non-deductible
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-900 font-bold">
                    <td className="py-3 text-gray-900">TOTAL EXPENSES</td>
                    <td className="py-3 text-right text-gray-900">
                      {formatCurrency(statement.expenses.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 italic py-2">No expense transactions in this period</p>
            )}
          </div>

          {/* Net Income Section */}
          <div className="border-t-4 border-gray-900 pt-4">
            <table className="w-full">
              <tbody>
                <tr className="text-xl font-bold">
                  <td className={`py-3 ${statement.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    NET {statement.netIncome >= 0 ? 'PROFIT' : 'LOSS'}
                  </td>
                  <td className={`py-3 text-right ${statement.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(Math.abs(statement.netIncome))}
                  </td>
                </tr>
                <tr className="text-lg font-semibold border-t border-gray-300">
                  <td className="py-3 text-gray-900">
                    TAXABLE INCOME
                    <span className="text-xs font-normal text-gray-600 ml-2">
                      (Excludes non-deductible expenses)
                    </span>
                  </td>
                  <td className="py-3 text-right text-gray-900">
                    {formatCurrency(statement.taxableIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Key Metrics */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-300">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-700 font-medium">Profit Margin</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{profitMargin}%</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-700 font-medium">Total Revenue</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {formatCurrency(statement.revenue.total)}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-sm text-red-700 font-medium">Total Expenses</div>
              <div className="text-2xl font-bold text-red-900 mt-1">
                {formatCurrency(statement.expenses.total)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex gap-3 justify-end pt-6 border-t border-gray-300">
            <button
              onClick={() => window.print()}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Print Statement
            </button>
            <button
              onClick={() => window.print()}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Export as PDF
            </button>
          </div>
        </div>
      )}

      {!statement && !loading && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Generate Your Profit & Loss Statement
          </h3>
          <p className="text-gray-600">
            Select a date range above to view your income and expenses
          </p>
        </div>
      )}
    </div>
  );
}
