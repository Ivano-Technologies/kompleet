"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

/** Marks report data written by the VAT computation (convex/lib/vatPosition.ts). */
export const VAT_REPORT_KIND = "vat";

export interface VatReportFigures {
  output_vat: number;
  input_vat: number;
  net_vat: number;
  invoice_count?: number;
  expense_count?: number;
}

/**
 * VAT figures stored on a report, or null when a VAT report still holds the
 * income tax computation it was saved with before IVA-321.
 */
export function vatFiguresOf(computation: unknown): VatReportFigures | null {
  if (!computation || typeof computation !== "object") return null;
  const data = computation as Record<string, unknown>;
  if (data.kind !== VAT_REPORT_KIND) return null;
  const { output_vat, input_vat, net_vat } = data;
  if (
    typeof output_vat !== "number" ||
    typeof input_vat !== "number" ||
    typeof net_vat !== "number"
  ) {
    return null;
  }
  return {
    output_vat,
    input_vat,
    net_vat,
    invoice_count:
      typeof data.invoice_count === "number" ? data.invoice_count : undefined,
    expense_count:
      typeof data.expense_count === "number" ? data.expense_count : undefined,
  };
}

const CARD =
  "p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface";
const ROW_LABEL = "text-light-text-secondary dark:text-dark-text-secondary";
const ROW_VALUE =
  "font-medium text-light-text-primary dark:text-dark-text-primary";
const ROW_NOTE =
  "block text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-0.5";

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function VatReportSummary({
  figures,
  formatCurrency,
}: {
  figures: VatReportFigures;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <div className={CARD} data-testid="vat-summary">
      <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
        VAT Summary
      </h2>
      <div className="space-y-0 divide-y divide-light-border/50 dark:divide-dark-border/50">
        <div className="flex justify-between gap-4 py-2.5 text-sm">
          <span className={ROW_LABEL}>
            Output VAT
            <span className={ROW_NOTE}>
              VAT on invoices issued in this period
              {figures.invoice_count !== undefined
                ? ` (${plural(figures.invoice_count, "invoice")})`
                : ""}
            </span>
          </span>
          <span className={ROW_VALUE} data-testid="vat-output">
            {formatCurrency(figures.output_vat)}
          </span>
        </div>
        <div className="flex justify-between gap-4 py-2.5 text-sm">
          <span className={ROW_LABEL}>
            Input VAT
            <span className={ROW_NOTE}>
              VAT on expenses dated in this period
              {figures.expense_count !== undefined
                ? ` (${plural(figures.expense_count, "expense")})`
                : ""}
            </span>
          </span>
          <span className={ROW_VALUE} data-testid="vat-input">
            {formatCurrency(figures.input_vat)}
          </span>
        </div>
        <div className="flex justify-between gap-4 py-3 mt-1 bg-primary-500/5 dark:bg-primary-500/10 px-3 rounded-lg">
          <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
            Net VAT
            <span className={`${ROW_NOTE} font-normal`}>
              Output VAT minus input VAT
            </span>
          </span>
          <span
            className="font-bold text-primary-500 text-lg whitespace-nowrap"
            data-testid="vat-net"
          >
            {formatCurrency(figures.net_vat)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function VatLegacyNotice({
  onRegenerate,
  regenerating,
}: {
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  return (
    <div
      className="p-5 rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 print:hidden"
      data-testid="vat-legacy-notice"
      role="status"
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">
          This report has no VAT figures
        </h2>
      </div>
      <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed mb-4">
        This VAT report was generated with the income tax computation, so it
        does not show output VAT, input VAT or net VAT. Regenerate it to
        replace the figures with the VAT computation for the same period.
      </p>
      <button
        type="button"
        onClick={onRegenerate}
        disabled={regenerating}
        className="btn-primary text-sm px-3 py-2 inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${regenerating ? "animate-spin" : ""}`}
        />
        {regenerating ? "Regenerating..." : "Regenerate"}
      </button>
    </div>
  );
}
