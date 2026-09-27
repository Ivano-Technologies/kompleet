"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  defaultPeriodKey,
  periodBounds,
  periodOptions,
  TAX_COPY,
  type TaxEntity,
} from "./tax-copy";
import { fetchBooksSummary, type BooksSummary } from "./books-summary";

function entityToFormType(entity: TaxEntity): "PIT" | "CIT" | "VAT" {
  if (entity === "pit") return "PIT";
  if (entity === "vat") return "VAT";
  return "CIT";
}

export function FilingGenerateSheet({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated: (result: {
    formId: string;
    pdfUrl: string;
    formType: "PIT" | "CIT" | "VAT";
  }) => void;
}) {
  const [entity, setEntity] = useState<TaxEntity>("cit");
  const [periodKey, setPeriodKey] = useState(defaultPeriodKey);
  const [source, setSource] = useState<"books" | "override">("books");
  const [summary, setSummary] = useState<BooksSummary | null>(null);
  const [overrideRevenue, setOverrideRevenue] = useState("");
  const [overrideExpenses, setOverrideExpenses] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bounds = periodBounds(periodKey);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const next = await fetchBooksSummary(bounds.startDate, bounds.endDate);
        if (!cancelled) setSummary(next);
      } catch {
        if (!cancelled) setSummary({ income: 0, expenses: 0, turnover: 0, count: 0, uncategorized: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, bounds.startDate, bounds.endDate]);

  if (!open) return null;

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const revenue =
        source === "override"
          ? Number(overrideRevenue) || 0
          : summary?.income ?? 0;
      const expenses =
        source === "override"
          ? Number(overrideExpenses) || 0
          : summary?.expenses ?? 0;
      const formType = entityToFormType(entity);
      const taxable = Math.max(0, revenue - expenses);

      const formData =
        formType === "PIT"
          ? {
              taxpayerName: "From books",
              tin: "",
              address: "",
              phone: "",
              email: "",
              taxYear: bounds.taxYear,
              grossIncome: revenue,
              consolidatedRelief: 0,
              otherReliefs: 0,
              taxableIncome: taxable,
              taxPayable: 0,
              withholdingTax: 0,
              balanceDue: 0,
            }
          : formType === "VAT"
            ? {
                businessName: "From books",
                tin: "",
                address: "",
                phone: "",
                email: "",
                period: bounds.label,
                taxYear: bounds.taxYear,
                outputVAT: 0,
                inputVAT: 0,
                netVAT: 0,
                penaltyIfAny: 0,
                totalDue: 0,
              }
            : {
                companyName: "From books",
                rcNumber: "",
                tin: "",
                address: "",
                phone: "",
                email: "",
                taxYear: bounds.taxYear,
                turnover: revenue,
                costOfSales: 0,
                grossProfit: revenue,
                operatingExpenses: expenses,
                profitBeforeTax: taxable,
                capitalAllowances: 0,
                taxableProfit: taxable,
                taxRate: 0,
                taxPayable: 0,
                advancePayments: 0,
                balanceDue: 0,
              };

      const response = await fetch("/api/forms/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          formType,
          taxYear: bounds.taxYear,
          formData,
        }),
      });
      const body = (await response.json()) as {
        success?: boolean;
        formId?: string;
        pdfUrl?: string;
        error?: string;
      };
      if (!response.ok || !body.formId || !body.pdfUrl) {
        throw new Error(body.error || "Failed to generate PDF");
      }
      onGenerated({ formId: body.formId, pdfUrl: body.pdfUrl, formType });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg text-text-1">{TAX_COPY.filingGenTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-3 hover:text-text-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="text-text-2">Form type</span>
            <select
              value={entity}
              onChange={(event) => setEntity(event.target.value as TaxEntity)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1"
            >
              <option value="pit">{TAX_COPY.entityPit}</option>
              <option value="cit">{TAX_COPY.entityCit}</option>
              <option value="vat">{TAX_COPY.entityVat}</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-text-2">{TAX_COPY.period}</span>
            <select
              value={periodKey}
              onChange={(event) => setPeriodKey(event.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1"
            >
              {periodOptions().map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="text-sm">
            <legend className="text-text-2">Source</legend>
            <div className="mt-2 space-y-1.5">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={source === "books"}
                  onChange={() => setSource("books")}
                />
                {TAX_COPY.filingSourceBooks}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={source === "override"}
                  onChange={() => setSource("override")}
                />
                {TAX_COPY.filingSourceOverride}
              </label>
            </div>
          </fieldset>
          {source === "override" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-text-2">Revenue (₦)</span>
                <input
                  type="number"
                  min="0"
                  value={overrideRevenue}
                  onChange={(event) => setOverrideRevenue(event.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1"
                />
              </label>
              <label className="block text-sm">
                <span className="text-text-2">Expenses (₦)</span>
                <input
                  type="number"
                  min="0"
                  value={overrideExpenses}
                  onChange={(event) => setOverrideExpenses(event.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1"
                />
              </label>
            </div>
          )}
          {(summary?.uncategorized ?? 0) > 0 && source === "books" && (
            <p className="text-sm text-warning">{TAX_COPY.warnUncat(summary?.uncategorized ?? 0)}</p>
          )}
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              className="btn-primary text-sm px-3 py-2"
              disabled={busy}
              onClick={() => void generate()}
            >
              {busy ? "Generating…" : TAX_COPY.filingGenCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarkFiledSheet({
  open,
  formId,
  onClose,
  onFiled,
}: {
  open: boolean;
  formId: string | null;
  onClose: () => void;
  onFiled: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !formId) return null;

  const submit = async () => {
    if (!confirmation.trim()) {
      setError("Confirmation number is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/forms/${formId}/mark-filed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmationNumber: confirmation.trim() }),
      });
      const body = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok) {
        throw new Error(body.error || "Failed to mark as filed");
      }
      setConfirmation("");
      onFiled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark as filed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-1">
        <h2 className="font-display text-lg text-text-1">{TAX_COPY.filingMark}</h2>
        <p className="text-sm text-text-2 mt-1">
          Enter the confirmation number from the NRS portal. Kompleet does not auto-file.
        </p>
        <label className="block text-sm mt-4">
          <span className="text-text-2">{TAX_COPY.filingConfirm}</span>
          <input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1"
          />
        </label>
        {error && <p className="text-sm text-error mt-2">{error}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="btn-secondary text-sm px-3 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary text-sm px-3 py-2"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "Saving…" : TAX_COPY.filingMark}
          </button>
        </div>
      </div>
    </div>
  );
}
