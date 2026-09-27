"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { CategoryPicker } from "./CategoryPicker";
import { TRIAGE_COPY } from "./triage-copy";
import {
  formatTriageAmount,
  formatTriageDate,
  titleCaseMerchant,
  type TriageCategory,
  type TriageCounts,
  type TriageRow,
  type TriageSnapshot,
  emptyTriageCounts,
} from "@/lib/transactions/triage";

const UNDO_MS = 5000;

type ToastState = {
  message: string;
  snapshots: TriageSnapshot[];
};

type TriageResponse = {
  items: TriageRow[];
  counts: TriageCounts;
  categories: TriageCategory[];
};

export function useTriageCount(initial?: Partial<TriageCounts>) {
  const [counts, setCounts] = useState<TriageCounts>({
    ...emptyTriageCounts(),
    ...initial,
  });

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/transactions/triage?limit=1", {
        credentials: "include",
      });
      if (!response.ok) return;
      const body = (await response.json()) as { counts?: TriageCounts };
      if (body.counts) setCounts(body.counts);
    } catch {
      /* banner stays on last known count */
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  return { counts, setCounts, refresh };
}

function ReasonChip({ reason }: { reason: TriageRow["reason"] }) {
  const warn = reason !== "uncategorised";
  const label =
    reason === "uncategorised"
      ? TRIAGE_COPY.chipUncategorised
      : reason === "duplicate_suspect"
        ? TRIAGE_COPY.chipDuplicate
        : TRIAGE_COPY.chipLowConfidence;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        warn
          ? "border border-warning/35 bg-warning/10 text-warning"
          : "border border-border bg-surface-2 text-text-2"
      }`}
    >
      {label}
    </span>
  );
}

function TriageRowCard({
  row,
  categories,
  busy,
  onAction,
}: {
  row: TriageRow;
  categories: TriageCategory[];
  busy: boolean;
  onAction: (
    op: "categorise" | "confirm" | "ignore",
    row: TriageRow,
    category?: TriageCategory,
  ) => Promise<void>;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const credit = row.transactionType === "credit";
  const primary =
    row.reason === "uncategorised"
      ? "categorise"
      : "confirm";
  const primaryTeal = row.reason !== "duplicate_suspect";

  return (
    <article className="rounded-xl border border-border bg-surface p-3.5 hover:bg-surface-2/60">
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate text-sm font-semibold text-text-1">
          {titleCaseMerchant(row.merchant)}
        </h3>
        <p
          className={`shrink-0 text-sm font-bold tabular-nums ${
            credit ? "text-success" : "text-text-1"
          }`}
        >
          {formatTriageAmount(row.amount, row.transactionType)}
        </p>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-3">{formatTriageDate(row.date)}</span>
        {row.bankMeta ? (
          <>
            <span className="text-xs text-text-3">·</span>
            <span className="max-w-[12rem] truncate text-xs text-text-3">
              {row.bankMeta}
            </span>
          </>
        ) : null}
        <ReasonChip reason={row.reason} />
      </div>
      {row.suggestedCategory && row.reason !== "duplicate_suspect" ? (
        <p className="mt-1 text-xs text-text-3">
          {TRIAGE_COPY.suggested(row.suggestedCategory.name)}
        </p>
      ) : null}
      <div className="relative mt-3 flex items-center justify-end gap-2">
        {row.reason === "duplicate_suspect" ? (
          <a
            href="/transactions/duplicates"
            className="px-2.5 py-2 text-sm font-medium text-text-3 hover:text-text-1"
          >
            {TRIAGE_COPY.viewDuplicate}
          </a>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onAction("ignore", row)}
          className="px-2.5 py-2 text-sm font-medium text-text-3 hover:text-text-1 disabled:opacity-50"
        >
          {TRIAGE_COPY.ignore}
        </button>
        {primary === "categorise" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => setPickerOpen((open) => !open)}
            className="rounded-[10px] bg-accent px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            {TRIAGE_COPY.categorise}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onAction("confirm", row)}
            className={
              primaryTeal
                ? "rounded-[10px] bg-accent px-3.5 py-2 text-sm font-semibold text-white hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                : "rounded-[10px] border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-primary hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            }
          >
            {TRIAGE_COPY.confirm}
          </button>
        )}
        {pickerOpen ? (
          <CategoryPicker
            categories={categories}
            onClose={() => setPickerOpen(false)}
            onPick={(category) => {
              setPickerOpen(false);
              void onAction("categorise", row, category);
            }}
          />
        ) : null}
      </div>
    </article>
  );
}

function TriagePanel({
  items,
  counts,
  categories,
  busy,
  confirmBulk,
  onAction,
  onClose,
  onBulkIgnore,
  onConfirmBulk,
  onCancelBulk,
}: {
  items: TriageRow[];
  counts: TriageCounts;
  categories: TriageCategory[];
  busy: boolean;
  confirmBulk: boolean;
  onAction: (
    op: "categorise" | "confirm" | "ignore",
    row: TriageRow,
    category?: TriageCategory,
  ) => Promise<void>;
  onClose: () => void;
  onBulkIgnore: () => void;
  onConfirmBulk: () => void;
  onCancelBulk: () => void;
}) {
  return (
    <>
      <header className="flex items-start justify-between border-b border-border px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-text-1">{TRIAGE_COPY.title}</h2>
          <p className="mt-1 text-xs text-text-3">
            {TRIAGE_COPY.sub(counts.needsCheck)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-primary"
          aria-label={TRIAGE_COPY.close}
        >
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="flex-1 space-y-2 overflow-auto p-4">
        {items.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-text-2">
            {TRIAGE_COPY.empty}
          </p>
        ) : (
          items.map((row) => (
            <TriageRowCard
              key={`${row.kind}-${row.id}`}
              row={row}
              categories={categories}
              busy={busy}
              onAction={onAction}
            />
          ))
        )}
      </div>
      {counts.lowConfidence > 0 ? (
        <footer className="border-t border-border px-4 py-3 pb-5">
          {confirmBulk ? (
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-2">
              <span>{TRIAGE_COPY.bulkIgnoreLowConfirm(counts.lowConfidence)}</span>
              <button
                type="button"
                className="text-text-3 underline underline-offset-2"
                onClick={onCancelBulk}
              >
                {TRIAGE_COPY.bulkCancel}
              </button>
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={onConfirmBulk}
              >
                {TRIAGE_COPY.ignore}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onBulkIgnore}
              className="text-xs font-medium text-text-3 underline underline-offset-2 hover:text-text-2"
            >
              {TRIAGE_COPY.bulkIgnoreLow}
            </button>
          )}
        </footer>
      ) : null}
    </>
  );
}

export function TriageSheet({
  open,
  onClose,
  onCounts,
  variant = "drawer",
}: {
  open: boolean;
  onClose: () => void;
  onCounts?: (counts: TriageCounts) => void;
  variant?: "drawer" | "page";
}) {
  const router = useRouter();
  const [items, setItems] = useState<TriageRow[]>([]);
  const [counts, setCounts] = useState<TriageCounts>(emptyTriageCounts());
  const [categories, setCategories] = useState<TriageCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/transactions/triage", {
        credentials: "include",
      });
      if (!response.ok) return;
      const body = (await response.json()) as TriageResponse;
      setItems(body.items ?? []);
      setCounts(body.counts ?? emptyTriageCounts());
      setCategories(body.categories ?? []);
      onCounts?.(body.counts ?? emptyTriageCounts());
    } finally {
      setLoading(false);
    }
  }, [onCounts]);

  useEffect(() => {
    if (open || variant === "page") void load();
  }, [open, variant, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const apply = async (
    op: "categorise" | "confirm" | "ignore",
    row: TriageRow,
    category?: TriageCategory,
  ) => {
    setBusy(true);
    try {
      const response = await fetch("/api/transactions/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          op,
          kind: row.kind,
          id: row.id,
          categoryId: category?.id,
        }),
      });
      if (!response.ok) return;
      const body = (await response.json()) as { snapshot?: TriageSnapshot };
      if (body.snapshot) {
        const message =
          op === "categorise" && category
            ? TRIAGE_COPY.toastCategorised(category.name)
            : op === "confirm"
              ? TRIAGE_COPY.toastConfirmed
              : TRIAGE_COPY.toastIgnored;
        setToast({ message, snapshots: [body.snapshot] });
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  const undo = async () => {
    if (!toast) return;
    setBusy(true);
    try {
      for (const snapshot of toast.snapshots) {
        await fetch("/api/transactions/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ op: "undo", snapshot }),
        });
      }
      setToast(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const confirmBulkIgnore = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/transactions/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ op: "ignore_low" }),
      });
      if (response.ok) {
        const body = (await response.json()) as { snapshots?: TriageSnapshot[] };
        setToast({
          message: TRIAGE_COPY.toastIgnored,
          snapshots: body.snapshots ?? [],
        });
      }
      setConfirmBulk(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const panel = (
    <TriagePanel
      items={items}
      counts={counts}
      categories={categories}
      busy={busy}
      confirmBulk={confirmBulk}
      onAction={apply}
      onClose={
        variant === "page"
          ? () => router.push("/transactions")
          : onClose
      }
      onBulkIgnore={() => setConfirmBulk(true)}
      onConfirmBulk={() => void confirmBulkIgnore()}
      onCancelBulk={() => setConfirmBulk(false)}
    />
  );

  const toastBar = toast ? (
    <div className="pointer-events-auto mx-4 mb-4 flex items-center justify-between gap-4 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white">
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={() => void undo()}
        className="font-bold text-accent"
      >
        {TRIAGE_COPY.undo}
      </button>
    </div>
  ) : null;

  if (variant === "page") {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-[520px] flex-col rounded-2xl border border-border bg-surface shadow-1">
        {loading && items.length === 0 ? (
          <p className="p-6 text-sm text-text-3">{TRIAGE_COPY.loading}</p>
        ) : (
          panel
        )}
        {toastBar}
      </div>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={TRIAGE_COPY.close}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="triage-title"
        className="absolute inset-0 flex flex-col bg-surface shadow-[-8px_0_32px_rgba(0,0,0,0.18)] lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[520px] lg:border-l lg:border-border"
      >
        <span id="triage-title" className="sr-only">
          {TRIAGE_COPY.title}
        </span>
        {loading && items.length === 0 ? (
          <p className="p-6 text-sm text-text-3">{TRIAGE_COPY.loading}</p>
        ) : (
          panel
        )}
        {toastBar}
      </aside>
    </div>
  );
}
