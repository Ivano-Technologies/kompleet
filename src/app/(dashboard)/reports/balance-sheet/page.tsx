'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Download, BarChart3, Loader2 } from 'lucide-react';

interface LineItem { category: string; amount: number; count: number; }

interface BalanceSheet {
  period: { asOf: string };
  assets: { current: { items: LineItem[]; total: number }; nonCurrent: { items: LineItem[]; total: number }; total: number };
  liabilities: { current: { items: LineItem[]; total: number }; nonCurrent: { items: LineItem[]; total: number }; total: number };
  equity: { items: LineItem[]; total: number };
  totalLiabilitiesAndEquity: number;
}

export default function BalanceSheetPage() {
  const [statement, setStatement] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOfDate, setAsOfDate] = useState('');

  const handleGenerate = async () => {
    if (!asOfDate) { alert('Please select a date'); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/balance-sheet?asOfDate=${asOfDate}`);
      const data = await response.json();
      if (response.ok) setStatement(data.statement);
      else alert(data.error || 'Failed to generate statement');
    } catch (error) { console.error('Error:', error); alert('An error occurred'); }
    finally { setLoading(false); }
  };

  const fmt = (a: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(a);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

  const currentRatio = statement && statement.liabilities.current.total > 0
    ? (statement.assets.current.total / statement.liabilities.current.total).toFixed(2) : 'N/A';
  const debtToEquity = statement && statement.equity.total > 0
    ? (statement.liabilities.total / statement.equity.total).toFixed(2) : 'N/A';

  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-primary-500';

  const SectionTable = ({ items, totalLabel, total }: { items: LineItem[]; totalLabel: string; total: number }) => (
    items.length > 0 ? (
      <table className="w-full text-sm">
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-light-border/50 dark:border-dark-border/50">
              <td className="py-1.5 text-light-text-secondary dark:text-dark-text-secondary">{item.category}</td>
              <td className="py-1.5 text-right font-medium text-light-text-primary dark:text-dark-text-primary">{fmt(item.amount)}</td>
            </tr>
          ))}
          <tr className="font-semibold border-t border-light-border dark:border-dark-border">
            <td className="py-2 text-light-text-primary dark:text-dark-text-primary">{totalLabel}</td>
            <td className="py-2 text-right text-light-text-primary dark:text-dark-text-primary">{fmt(total)}</td>
          </tr>
        </tbody>
      </table>
    ) : <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary italic py-2">None recorded</p>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/reports" className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-400 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">Balance Sheet</h1>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">Statement of Financial Position — Nigerian accounting standards</p>
      </div>

      {/* Date Selection */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">Select Date</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1.5">As of Date</label>
            <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className={inputCls} />
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-1.5 disabled:opacity-50">
              {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : 'Generate Statement'}
            </button>
          </div>
        </div>
      </div>

      {/* Statement */}
      {statement && (
        <div className="p-6 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <div className="text-center mb-6 pb-4 border-b-2 border-light-text-primary dark:border-dark-text-primary">
            <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">BALANCE SHEET</h2>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">As of {fmtDate(statement.period.asOf)}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets */}
            <div>
              <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary mb-3 pb-1.5 border-b-2 border-light-text-primary dark:border-dark-text-primary">ASSETS</h3>
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2 uppercase tracking-wide">Current Assets</h4>
                <SectionTable items={statement.assets.current.items} totalLabel="Total Current" total={statement.assets.current.total} />
              </div>
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2 uppercase tracking-wide">Non-Current Assets</h4>
                <SectionTable items={statement.assets.nonCurrent.items} totalLabel="Total Non-Current" total={statement.assets.nonCurrent.total} />
              </div>
              <div className="border-t-4 border-light-text-primary dark:border-dark-text-primary pt-2">
                <div className="flex justify-between text-base font-bold text-light-text-primary dark:text-dark-text-primary py-2">
                  <span>TOTAL ASSETS</span><span>{fmt(statement.assets.total)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div>
              <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary mb-3 pb-1.5 border-b-2 border-light-text-primary dark:border-dark-text-primary">LIABILITIES & EQUITY</h3>
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2 uppercase tracking-wide">Current Liabilities</h4>
                <SectionTable items={statement.liabilities.current.items} totalLabel="Total Current" total={statement.liabilities.current.total} />
              </div>
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2 uppercase tracking-wide">Non-Current Liabilities</h4>
                <SectionTable items={statement.liabilities.nonCurrent.items} totalLabel="Total Non-Current" total={statement.liabilities.nonCurrent.total} />
              </div>
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-2 uppercase tracking-wide">Equity</h4>
                <SectionTable items={statement.equity.items} totalLabel="Total Equity" total={statement.equity.total} />
              </div>
              <div className="border-t-4 border-light-text-primary dark:border-dark-text-primary pt-2">
                <div className="flex justify-between text-base font-bold text-light-text-primary dark:text-dark-text-primary py-2">
                  <span>TOTAL L & E</span><span>{fmt(statement.totalLiabilitiesAndEquity)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Ratios */}
          <div className="mt-6 grid grid-cols-3 gap-3 pt-4 border-t border-light-border dark:border-dark-border">
            {[
              { label: 'Current Ratio', value: currentRatio, sub: 'Current Assets / Current Liabilities', color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Total Assets', value: fmt(statement.assets.total), color: 'text-green-600 dark:text-green-400' },
              { label: 'Debt-to-Equity', value: debtToEquity, sub: 'Total Liabilities / Total Equity', color: 'text-purple-600 dark:text-purple-400' },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-lg bg-light-background dark:bg-dark-background">
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">{m.label}</p>
                <p className={`text-base font-bold mt-0.5 ${m.color}`}>{m.value}</p>
                {m.sub && <p className="text-[10px] text-light-text-tertiary dark:text-dark-text-tertiary mt-0.5">{m.sub}</p>}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-2 justify-end pt-4 border-t border-light-border dark:border-dark-border">
            <button onClick={() => window.print()} className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={() => window.print()} className="btn-primary text-sm px-3 py-2 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>
      )}

      {!statement && !loading && (
        <div className="py-12 text-center rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-light-text-tertiary dark:text-dark-text-tertiary opacity-40" />
          <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">Generate Your Balance Sheet</h3>
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">Select a date above to view assets, liabilities, and equity</p>
        </div>
      )}
    </div>
  );
}
