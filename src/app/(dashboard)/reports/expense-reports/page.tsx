"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";

const DEFAULT_START = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1,
)
  .toISOString()
  .slice(0, 10);
const DEFAULT_END = new Date().toISOString().slice(0, 10);

export default function ExpenseReportsPage() {
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);
  const [exporting, setExporting] = useState<string | null>(null);

  async function handleExport(format: "csv" | "pdf" | "excel") {
    setExporting(format);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        format,
      });
      const res = await fetch(`/api/expenses/export?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers
          .get("Content-Disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") ??
        `expenses_${startDate}_${endDate}.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
          Expense Reports
        </h1>
        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Export expenses by date range (PDF, CSV, or Excel)
        </p>
      </div>

      <div className="rounded-lg bg-light-surface dark:bg-dark-surface p-6 shadow">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg px-3 py-2 text-light-text-primary dark:text-dark-text-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg px-3 py-2 text-light-text-primary dark:text-dark-text-primary"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={!!exporting}
            className="inline-flex items-center gap-2 rounded-md bg-[#008751] px-4 py-2 text-sm font-medium text-white hover:bg-[#006b42] disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exporting === "csv" ? "Exporting…" : "Download CSV"}
          </button>
          <button
            type="button"
            onClick={() => handleExport("excel")}
            disabled={!!exporting}
            className="inline-flex items-center gap-2 rounded-md bg-[#008751] px-4 py-2 text-sm font-medium text-white hover:bg-[#006b42] disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exporting === "excel" ? "Exporting…" : "Download Excel"}
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            className="inline-flex items-center gap-2 rounded-md bg-[#008751] px-4 py-2 text-sm font-medium text-white hover:bg-[#006b42] disabled:opacity-60"
          >
            <FileText className="h-4 w-4" />
            {exporting === "pdf" ? "Exporting…" : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
