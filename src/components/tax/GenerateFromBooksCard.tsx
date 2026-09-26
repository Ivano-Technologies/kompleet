"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  defaultPeriodKey,
  entityToGenerateArgs,
  periodBounds,
  periodOptions,
  TAX_COPY,
  type TaxEntity,
} from "./tax-copy";
import { fetchBooksSummary, formatNaira, type BooksSummary } from "./books-summary";

export function GenerateFromBooksCard({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const router = useRouter();
  const [periodKey, setPeriodKey] = useState(defaultPeriodKey);
  const [entity, setEntity] = useState<TaxEntity>("cit");
  const [summary, setSummary] = useState<BooksSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bounds = periodBounds(periodKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const next = await fetchBooksSummary(bounds.startDate, bounds.endDate);
        if (!cancelled) {
          setSummary(next);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSummary(null);
          setError(err instanceof Error ? err.message : "Failed to load books");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bounds.startDate, bounds.endDate]);

  const hasBooks = (summary?.count ?? 0) > 0;

  const generate = async () => {
    if (!summary || !hasBooks) return;
    setGenerating(true);
    setError(null);
    try {
      const mapped = entityToGenerateArgs(entity);
      const response = await fetch("/api/tax-reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reportType: mapped.reportType,
          taxYear: bounds.taxYear,
          periodStart: bounds.startDate,
          periodEnd: bounds.endDate,
          businessType: mapped.businessType,
          turnover: summary.turnover,
          totalAssets: 0,
          totalRevenue: summary.income,
          totalExpenses: summary.expenses,
          annualIncome: entity === "pit" ? summary.income : undefined,
        }),
      });
      const body = (await response.json()) as {
        report?: { id: string };
        error?: string;
      };
      if (!response.ok || !body.report?.id) {
        throw new Error(body.error || "Failed to generate report");
      }
      router.push(`/tax-reports/${body.report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      {!embedded && (
        <div>
          <h2 className="font-semibold text-base text-text-1">{TAX_COPY.cardTitle}</h2>
          <p className="text-sm text-text-3 mt-1">
            Period + entity only when books exist — no revenue/expense form wall.
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-3">Loading books…</p>
      ) : !hasBooks ? (
        <div className="space-y-3">
          <p className="text-sm text-text-1">{TAX_COPY.emptyNoBooks}</p>
          <Link href="/transactions" className="btn-secondary text-sm px-3 py-2 inline-flex">
            {TAX_COPY.emptyImportCta}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-text-2">{TAX_COPY.period}</span>
              <select
                value={periodKey}
                onChange={(event) => setPeriodKey(event.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {periodOptions().map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="text-sm">
              <legend className="text-text-2">{TAX_COPY.entity}</legend>
              <div className="mt-2 space-y-1.5">
                {(
                  [
                    ["pit", TAX_COPY.entityPit],
                    ["cit", TAX_COPY.entityCit],
                    ["vat", TAX_COPY.entityVat],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-text-1">
                    <input
                      type="radio"
                      name="tax-entity"
                      checked={entity === value}
                      onChange={() => setEntity(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-3">
              {TAX_COPY.summary}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs border border-border bg-surface-2 text-text-1">
                Revenue {formatNaira(summary?.income ?? 0)}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs border border-border bg-surface-2 text-text-1">
                Expenses {formatNaira(summary?.expenses ?? 0)}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs border border-border bg-surface-2 text-text-1">
                Turnover {formatNaira(summary?.turnover ?? 0)}
              </span>
            </div>
          </div>

          {(summary?.uncategorized ?? 0) > 0 && (
            <div className="rounded-xl border border-warning bg-warning/10 px-3 py-2 text-sm text-text-1 flex items-center justify-between gap-3">
              <span>{TAX_COPY.warnUncat(summary?.uncategorized ?? 0)}</span>
              <Link href="/transactions/review" className="text-primary font-medium">
                {TAX_COPY.warnReview}
              </Link>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-primary text-sm px-3 py-2"
              disabled={generating}
              onClick={() => void generate()}
            >
              {generating ? "Generating…" : TAX_COPY.cta}
            </button>
            <Link href="/tax-reports/generate" className="text-sm font-medium text-primary">
              {TAX_COPY.advanced}
            </Link>
          </div>
        </>
      )}

      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
