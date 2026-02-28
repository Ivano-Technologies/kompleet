"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, TrendingUp } from "lucide-react";

export default function CashFlowPage() {
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
      if (response.ok) {
        // Cash flow uses same period data; in future a dedicated cash-flow API can return operating/investing/financing
        console.log("Period data:", data);
      } else {
        alert(data.error || "Failed to generate report");
      }
    } catch {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-primary-500";
  const labelCls =
    "block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/reports"
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-400 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
        </Link>
        <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
          Cash Flow Statement
        </h1>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
          Track how cash moves in and out of your business — operating, investing, and financing activities
        </p>
      </div>

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
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              {loading ? "Generating…" : "Generate Report"}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-center text-light-text-secondary dark:text-dark-text-secondary text-sm">
        Cash flow breakdown (operating, investing, financing) will appear here once generated. Use the date range above and click Generate Report.
      </div>
    </div>
  );
}
