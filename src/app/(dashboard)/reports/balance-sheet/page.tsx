'use client';

import { useState } from 'react';
import Link from 'next/link';

interface LineItem {
  category: string;
  amount: number;
  count: number;
}

interface BalanceSheet {
  period: { asOf: string };
  assets: {
    current: { items: LineItem[]; total: number };
    nonCurrent: { items: LineItem[]; total: number };
    total: number;
  };
  liabilities: {
    current: { items: LineItem[]; total: number };
    nonCurrent: { items: LineItem[]; total: number };
    total: number;
  };
  equity: {
    items: LineItem[];
    total: number;
  };
  totalLiabilitiesAndEquity: number;
}

export default function BalanceSheetPage() {
  const [statement, setStatement] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState('');

  const handleGenerate = async () => {
    if (!asOfDate) {
      alert('Please select a date');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/reports/balance-sheet?asOfDate=${asOfDate}`);
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

  const currentRatio = statement
    ? statement.liabilities.current.total > 0
      ? (statement.assets.current.total / statement.liabilities.current.total).toFixed(2)
      : 'N/A'
    : 'N/A';

  const debtToEquity = statement
    ? statement.equity.total > 0
      ? (statement.liabilities.total / statement.equity.total).toFixed(2)
      : 'N/A'
    : 'N/A';

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
        <h1 className="text-3xl font-bold text-gray-900">Balance Sheet</h1>
        <p className="text-gray-600 mt-1">
          Statement of Financial Position following Nigerian accounting standards
        </p>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              As of Date
            </label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
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
            <h2 className="text-2xl font-bold text-gray-900">BALANCE SHEET</h2>
            <p className="text-gray-600 mt-2">As of {formatDate(statement.period.asOf)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Assets */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-900 pb-2">
                ASSETS
              </h3>

              {/* Current Assets */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Current Assets</h4>
                {statement.assets.current.items.length > 0 ? (
                  <table className="w-full">
                    <tbody>
                      {statement.assets.current.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="py-2 text-gray-700 text-sm">{item.category}</td>
                          <td className="py-2 text-right font-medium text-gray-900 text-sm">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-semibold border-t border-gray-400">
                        <td className="py-2 text-gray-900">Total Current Assets</td>
                        <td className="py-2 text-right text-gray-900">
                          {formatCurrency(statement.assets.current.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic text-sm">No current assets</p>
                )}
              </div>

              {/* Non-Current Assets */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Non-Current Assets</h4>
                {statement.assets.nonCurrent.items.length > 0 ? (
                  <table className="w-full">
                    <tbody>
                      {statement.assets.nonCurrent.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="py-2 text-gray-700 text-sm">{item.category}</td>
                          <td className="py-2 text-right font-medium text-gray-900 text-sm">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-semibold border-t border-gray-400">
                        <td className="py-2 text-gray-900">Total Non-Current Assets</td>
                        <td className="py-2 text-right text-gray-900">
                          {formatCurrency(statement.assets.nonCurrent.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic text-sm">No non-current assets</p>
                )}
              </div>

              {/* Total Assets */}
              <div className="border-t-4 border-gray-900 pt-3">
                <table className="w-full">
                  <tbody>
                    <tr className="text-lg font-bold">
                      <td className="py-3 text-gray-900">TOTAL ASSETS</td>
                      <td className="py-3 text-right text-gray-900">
                        {formatCurrency(statement.assets.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Liabilities & Equity */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-900 pb-2">
                LIABILITIES & EQUITY
              </h3>

              {/* Current Liabilities */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Current Liabilities</h4>
                {statement.liabilities.current.items.length > 0 ? (
                  <table className="w-full">
                    <tbody>
                      {statement.liabilities.current.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="py-2 text-gray-700 text-sm">{item.category}</td>
                          <td className="py-2 text-right font-medium text-gray-900 text-sm">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-semibold border-t border-gray-400">
                        <td className="py-2 text-gray-900">Total Current Liabilities</td>
                        <td className="py-2 text-right text-gray-900">
                          {formatCurrency(statement.liabilities.current.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic text-sm">No current liabilities</p>
                )}
              </div>

              {/* Non-Current Liabilities */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Non-Current Liabilities
                </h4>
                {statement.liabilities.nonCurrent.items.length > 0 ? (
                  <table className="w-full">
                    <tbody>
                      {statement.liabilities.nonCurrent.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="py-2 text-gray-700 text-sm">{item.category}</td>
                          <td className="py-2 text-right font-medium text-gray-900 text-sm">
                            {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="font-semibold border-t border-gray-400">
                        <td className="py-2 text-gray-900">Total Non-Current Liabilities</td>
                        <td className="py-2 text-right text-gray-900">
                          {formatCurrency(statement.liabilities.nonCurrent.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 italic text-sm">No non-current liabilities</p>
                )}
              </div>

              {/* Equity */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Equity</h4>
                <table className="w-full">
                  <tbody>
                    {statement.equity.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="py-2 text-gray-700 text-sm">{item.category}</td>
                        <td className="py-2 text-right font-medium text-gray-900 text-sm">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="font-semibold border-t border-gray-400">
                      <td className="py-2 text-gray-900">Total Equity</td>
                      <td className="py-2 text-right text-gray-900">
                        {formatCurrency(statement.equity.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Liabilities & Equity */}
              <div className="border-t-4 border-gray-900 pt-3">
                <table className="w-full">
                  <tbody>
                    <tr className="text-lg font-bold">
                      <td className="py-3 text-gray-900">TOTAL LIABILITIES & EQUITY</td>
                      <td className="py-3 text-right text-gray-900">
                        {formatCurrency(statement.totalLiabilitiesAndEquity)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Key Ratios */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-300">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-700 font-medium">Current Ratio</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{currentRatio}</div>
              <div className="text-xs text-blue-600 mt-1">Current Assets / Current Liabilities</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-700 font-medium">Total Assets</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {formatCurrency(statement.assets.total)}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-700 font-medium">Debt-to-Equity Ratio</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">{debtToEquity}</div>
              <div className="text-xs text-purple-600 mt-1">Total Liabilities / Total Equity</div>
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
            Generate Your Balance Sheet
          </h3>
          <p className="text-gray-600">
            Select a date above to view your assets, liabilities, and equity
          </p>
        </div>
      )}
    </div>
  );
}
