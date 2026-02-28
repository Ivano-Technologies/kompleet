"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Receipt } from "lucide-react";

export default function TaxSummaryPage() {
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
          Tax Summary Report
        </h1>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
          Comprehensive overview of tax obligations — VAT, WHT, CIT. Ready for NRS/JTB submission.
        </p>
      </div>

      <div className="p-6 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Receipt className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                Generate tax reports
              </h2>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Create and view detailed tax reports by period and type.
              </p>
            </div>
          </div>
          <Link
            href="/tax-reports"
            className="btn-primary text-sm px-4 py-2.5 inline-flex items-center gap-2 shrink-0"
          >
            <FileText className="w-4 h-4" />
            Go to Tax Reports
          </Link>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-sm text-light-text-secondary dark:text-dark-text-secondary">
        <p className="mb-2">Tax Summary provides:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>VAT calculations</li>
          <li>Withholding tax summary</li>
          <li>CIT estimates</li>
          <li>Filing deadlines</li>
        </ul>
        <p className="mt-4">
          Use the <Link href="/tax-reports" className="text-primary hover:underline">Tax Reports</Link> section to generate and download reports for a specific period.
        </p>
      </div>
    </div>
  );
}
