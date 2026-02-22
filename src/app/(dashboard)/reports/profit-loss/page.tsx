"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Download, BarChart3, Loader2 } from "lucide-react";

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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`,
      );
      const data = await response.json();
      if (response.ok) setStatement(data.statement);
      else alert(data.error || "Failed to generate statement");
    } catch (error) {
      console.error("Error generating statement:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const profitMargin =
    statement && statement.revenue.total > 0
      ? ((statement.netIncome / statement.revenue.total) * 100).toFixed(2)
      : "0.00";

  const inputCls =
    "w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-primary-500";
  const labelCls =
    "block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/reports"
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-400 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
          Profit & Loss Statement
        </h1>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
          Income Statement following Nigerian accounting standards
        </p>
      </div>

      {/* Date Selection */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
          Select Period
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                </>
              ) : (
                "Generate Statement"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Statement */}
      {statement && (
        <div className="p-6 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <div className="text-center mb-6 pb-4 border-b-2 border-light-text-primary dark:border-dark-text-primary">
            <h2 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">
              PROFIT & LOSS STATEMENT
            </h2>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
              {fmtDate(statement.period.start)} to{" "}
              {fmtDate(statement.period.end)}
            </p>
          </div>

          {/* Revenue */}
          <div className="mb-5">
            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary mb-2 pb-1.5 border-b border-light-border dark:border-dark-border">
              REVENUE
            </h3>
            {statement.revenue.items.length > 0 ? (
              <table className="w-full text-sm">
                <tbody>
                  {statement.revenue.items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-light-border/50 dark:border-dark-border/50"
                    >
                      <td className="py-2 text-light-text-secondary dark:text-dark-text-secondary">
                        {item.category}{" "}
                        <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                          ({item.count})
                        </span>
                      </td>
                      <td className="py-2 text-right font-medium text-light-text-primary dark:text-dark-text-primary">
                        {fmt(item.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-light-text-primary dark:border-dark-text-primary font-bold">
                    <td className="py-2.5 text-light-text-primary dark:text-dark-text-primary">
                      TOTAL REVENUE
                    </td>
                    <td className="py-2.5 text-right text-light-text-primary dark:text-dark-text-primary">
                      {fmt(statement.revenue.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary italic py-2">
                No revenue transactions
              </p>
            )}
          </div>

          {/* Expenses */}
          <div className="mb-5">
            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary mb-2 pb-1.5 border-b border-light-border dark:border-dark-border">
              EXPENSES
            </h3>
            {statement.expenses.items.length > 0 ? (
              <table className="w-full text-sm">
                <tbody>
                  {statement.expenses.items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-light-border/50 dark:border-dark-border/50"
                    >
                      <td className="py-2 text-light-text-secondary dark:text-dark-text-secondary">
                        {item.category}{" "}
                        <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                          ({item.count})
                        </span>
                        {item.taxTreatment === "non_deductible" && (
                          <span className="ml-1.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 px-1.5 py-0.5 rounded">
                            Non-deductible
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right font-medium text-light-text-primary dark:text-dark-text-primary">
                        {fmt(item.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-light-text-primary dark:border-dark-text-primary font-bold">
                    <td className="py-2.5 text-light-text-primary dark:text-dark-text-primary">
                      TOTAL EXPENSES
                    </td>
                    <td className="py-2.5 text-right text-light-text-primary dark:text-dark-text-primary">
                      {fmt(statement.expenses.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary italic py-2">
                No expense transactions
              </p>
            )}
          </div>

          {/* Net Income */}
          <div className="border-t-4 border-light-text-primary dark:border-dark-text-primary pt-3">
            <table className="w-full">
              <tbody>
                <tr className="text-base font-bold">
                  <td
                    className={`py-2 ${statement.netIncome >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                  >
                    NET {statement.netIncome >= 0 ? "PROFIT" : "LOSS"}
                  </td>
                  <td
                    className={`py-2 text-right ${statement.netIncome >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}
                  >
                    {fmt(Math.abs(statement.netIncome))}
                  </td>
                </tr>
                <tr className="font-semibold border-t border-light-border dark:border-dark-border text-sm">
                  <td className="py-2 text-light-text-primary dark:text-dark-text-primary">
                    TAXABLE INCOME{" "}
                    <span className="text-xs font-normal text-light-text-tertiary dark:text-dark-text-tertiary">
                      (Excl. non-deductible)
                    </span>
                  </td>
                  <td className="py-2 text-right text-light-text-primary dark:text-dark-text-primary">
                    {fmt(statement.taxableIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Key Metrics */}
          <div className="mt-6 grid grid-cols-3 gap-3 pt-4 border-t border-light-border dark:border-dark-border">
            {[
              {
                label: "Profit Margin",
                value: `${profitMargin}%`,
                color: "text-blue-600 dark:text-blue-400",
              },
              {
                label: "Total Revenue",
                value: fmt(statement.revenue.total),
                color: "text-green-600 dark:text-green-400",
              },
              {
                label: "Total Expenses",
                value: fmt(statement.expenses.total),
                color: "text-red-600 dark:text-red-400",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="p-3 rounded-lg bg-light-background dark:bg-dark-background"
              >
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  {m.label}
                </p>
                <p className={`text-base font-bold mt-0.5 ${m.color}`}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-2 justify-end pt-4 border-t border-light-border dark:border-dark-border">
            <button
              onClick={() => window.print()}
              className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={() => window.print()}
              className="btn-primary text-sm px-3 py-2 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>
      )}

      {!statement && !loading && (
        <div className="py-12 text-center rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-light-text-tertiary dark:text-dark-text-tertiary opacity-40" />
          <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
            Generate Your Statement
          </h3>
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
            Select a date range above to view your income and expenses
          </p>
        </div>
      )}
    </div>
  );
}
