"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Download,
  MoreVertical,
  Search,
} from "lucide-react";
import {
  StatementDropZone,
  triggerStatementPicker,
} from "@/components/import/StatementDropZone";
import type { StatementUploadResult } from "@/components/import/StatementDropZone";
import { ExceptionBanner, ImportToast } from "@/components/import/ImportToast";
import { AddManualTransaction } from "@/components/import/AddManualTransaction";
import { DROP_COPY } from "@/components/import/statement-copy";
import { TriageSheet, useTriageCount } from "@/components/review/TriageSheet";
import { apiErrorMessage, toFriendlyMessage } from "@/lib/friendly-error";
import { ErrorText } from "@/components/ui/error-ref";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ListCardFooter,
  PageTurnButtons,
  showingCount,
} from "@/components/ui/list-pager";

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "debit" | "credit";
  balance?: number;
  category?: {
    id: string;
    name: string;
    category_type: string;
  };
  confidence_score?: number;
  is_reconciled: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextCursor: string | null;
  isDone: boolean;
}

export default function TransactionsPage() {
  const router = useRouter();
  const booksInputId = "books-statement-input";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    nextCursor: null,
    isDone: true,
  });
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    startDate: "",
    endDate: "",
  });
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<StatementUploadResult | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);
  const { counts, setCounts, refresh: refreshTriage } = useTriageCount();

  const cursor = cursors[cursors.length - 1] ?? null;
  const fetchGeneration = useRef(0);

  const fetchTransactions = useCallback(async () => {
    const generation = ++fetchGeneration.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(cursors.length),
        limit: pagination.limit.toString(),
        ...(cursor ? { cursor } : {}),
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
      });

      const response = await fetch(`/api/transactions?${params}`);
      if (generation !== fetchGeneration.current) return;
      const data = await response.json();
      if (generation !== fetchGeneration.current) return;

      if (response.ok) {
        const rows = data.transactions as Transaction[];
        setTransactions(rows);
        setPagination({
          page: cursors.length,
          limit: data.pagination.limit ?? pagination.limit,
          total: data.pagination.total,
          totalPages: cursors.length,
          nextCursor: data.pagination.nextCursor ?? null,
          isDone: Boolean(data.pagination.isDone),
        });
        setError(null);
      } else {
        setError(apiErrorMessage(data, "We couldn't load your transactions. Please try again."));
      }
    } catch (fetchError) {
      if (generation !== fetchGeneration.current) return;
      setError(toFriendlyMessage(fetchError, "We couldn't load your transactions. Please try again."));
    } finally {
      if (generation === fetchGeneration.current) setLoading(false);
    }
  }, [cursor, cursors.length, filters, pagination.limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("triage") === "open") setTriageOpen(true);
    if (params.get("import") === "1") {
      triggerStatementPicker(booksInputId);
    }
  }, []);

  const handleSuccess = useCallback(
    (result: StatementUploadResult) => {
      setToast(result);
      void refreshTriage();
      void fetchTransactions();
    },
    [fetchTransactions, refreshTriage],
  );

  const handleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} transaction(s)?`)) return;

    try {
      const response = await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        setError(null);
        fetchTransactions();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(apiErrorMessage(data, "We couldn't delete these transactions. Please try again."));
      }
    } catch (deleteError) {
      setError(toFriendlyMessage(deleteError, "We couldn't delete these transactions. Please try again."));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleExport = async (format: "csv" | "json") => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      const params = new URLSearchParams({
        format,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
      });

      const response = await fetch(`/api/transactions/export?${params}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(apiErrorMessage(data, "Export failed. Please try again."));
      }
    } catch (exportError) {
      setError(toFriendlyMessage(exportError, "Export failed. Please try again."));
    } finally {
      setExporting(false);
    }
  };

  const knownTotal =
    pagination.isDone && pagination.page === 1 ? pagination.total : null;
  const isEmpty =
    !loading &&
    pagination.isDone &&
    transactions.length === 0 &&
    !filters.search &&
    !filters.type &&
    !filters.startDate &&
    !filters.endDate;

  const updateFilters = (patch: Partial<typeof filters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setCursors([null]);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg flex justify-between items-center">
          <p className="text-red-600 dark:text-red-400 text-sm"><ErrorText text={error} /></p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl text-text-1">Books</h1>
          {knownTotal !== null && (
            <span className="text-xs font-medium text-text-3 bg-surface px-2.5 py-1 rounded-full border border-border">
              {knownTotal.toLocaleString()} total
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn-primary text-sm px-3 py-2"
            onClick={() => triggerStatementPicker(booksInputId)}
          >
            {DROP_COPY.ctaImportShort}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? "Exporting..." : DROP_COPY.ctaExport}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-surface rounded-lg border border-border shadow-1 z-20">
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-surface-2 rounded-t-lg text-text-1"
                >
                  Export as CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("json")}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-surface-2 rounded-b-lg text-text-1"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="text-sm font-medium text-primary px-2 py-2"
            onClick={() => setShowManual(true)}
          >
            {DROP_COPY.ctaManual}
          </button>
        </div>
      </div>

      <ExceptionBanner
        needsCheckCount={counts.needsCheck}
        duplicatesCount={counts.duplicateSuspect}
        onReview={() => setTriageOpen(true)}
      />

      {isEmpty ? (
        <StatementDropZone
          variant="hero"
          inputId={booksInputId}
          showWhy={false}
          title={DROP_COPY.heroTitle}
          subtitle={DROP_COPY.heroSub}
          onSuccess={handleSuccess}
          footer={
            <p className="mt-3 text-center text-sm text-text-2">
              {DROP_COPY.booksDocsHint.split(DROP_COPY.booksDocsLink)[0]}
              <Link
                href="/documents"
                className="font-semibold text-primary underline underline-offset-2"
              >
                {DROP_COPY.booksDocsLink}
              </Link>
              {DROP_COPY.booksDocsHint.split(DROP_COPY.booksDocsLink)[1]}
            </p>
          }
        />
      ) : (
        <StatementDropZone
          variant="strip"
          inputId={booksInputId}
          title={DROP_COPY.booksStripTitle}
          subtitle={DROP_COPY.booksStripSub}
          onSuccess={handleSuccess}
        />
      )}

      {!isEmpty && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-full !pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-1 placeholder-text-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => updateFilters({ type: e.target.value })}
            className="px-3 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => updateFilters({ startDate: e.target.value })}
            className="px-3 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => updateFilters({ endDate: e.target.value })}
            className="px-3 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-primary font-medium">
            {selectedIds.size} transaction{selectedIds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="text-sm bg-error hover:bg-error/90 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Delete Selected
          </button>
        </div>
      )}

      {!isEmpty && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-text-3">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Search}
                title="No transactions match these filters"
                description="Try a different search, type, or date range."
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-2.5 sm:px-5 py-3 text-left w-10">
                        <input
                          type="checkbox"
                          checked={
                            selectedIds.size === transactions.length &&
                            transactions.length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded border-border"
                        />
                      </th>
                      <th className="px-2.5 sm:px-5 py-3 text-left text-xs font-medium text-text-3 whitespace-nowrap">
                        Date
                      </th>
                      <th className="px-2.5 sm:px-5 py-3 text-left text-xs font-medium text-text-3">
                        Description
                      </th>
                      <th className="px-2.5 sm:px-5 py-3 text-left text-xs font-medium text-text-3 hidden md:table-cell">
                        Category
                      </th>
                      <th className="px-2.5 sm:px-5 py-3 text-right text-xs font-medium text-text-3 whitespace-nowrap w-[1%]">
                        Amount
                      </th>
                      <th className="px-2.5 sm:px-5 py-3 text-center text-xs font-medium text-text-3 hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-2.5 sm:px-5 py-3 text-center text-xs font-medium text-text-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-border/50 last:border-0 hover:bg-surface-2 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/transactions/${transaction.id}`)
                        }
                      >
                        <td
                          className="px-2.5 sm:px-5 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(transaction.id)}
                            onChange={() => handleSelectOne(transaction.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="px-2.5 sm:px-5 py-3.5 text-text-2 text-xs whitespace-nowrap">
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td className="px-2.5 sm:px-5 py-3.5 min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {transaction.transaction_type === "credit" ? (
                                <ArrowDown className="w-3.5 h-3.5 text-success" />
                              ) : (
                                <ArrowUp className="w-3.5 h-3.5 text-error" />
                              )}
                            </div>
                            <span className="font-medium text-sm text-text-1 truncate block min-w-0">
                              {transaction.description}
                            </span>
                          </div>
                        </td>
                        <td className="px-2.5 sm:px-5 py-3.5 hidden md:table-cell">
                          {transaction.category ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                              {transaction.category.name}
                              {transaction.confidence_score !== undefined &&
                                transaction.confidence_score < 100 && (
                                  <span className="ml-1 opacity-60">
                                    ({transaction.confidence_score}%)
                                  </span>
                                )}
                            </span>
                          ) : (
                            <span className="text-xs text-text-3">
                              Uncategorized
                            </span>
                          )}
                        </td>
                        <td className="px-2.5 sm:px-5 py-3.5 text-right whitespace-nowrap w-[1%]">
                          <span
                            className={`font-semibold text-sm tabular-nums ${
                              transaction.transaction_type === "credit"
                                ? "text-success"
                                : "text-text-1"
                            }`}
                          >
                            {transaction.transaction_type === "credit" ? "+" : ""}
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-2.5 sm:px-5 py-3.5 text-center hidden sm:table-cell">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              transaction.is_reconciled
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }`}
                          >
                            {transaction.is_reconciled ? "Reconciled" : "Pending"}
                          </span>
                        </td>
                        <td
                          className="px-2.5 sm:px-5 py-3.5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button className="p-1.5 hover:bg-bg rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-text-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ListCardFooter
                countLabel={showingCount(
                  transactions.length,
                  "transaction",
                  "transactions",
                )}
              >
                <PageTurnButtons
                  pageLabel={String(pagination.page)}
                  prevDisabled={pagination.page === 1}
                  nextDisabled={pagination.isDone || !pagination.nextCursor}
                  onPrev={() =>
                    setCursors((stack) =>
                      stack.length > 1 ? stack.slice(0, -1) : stack,
                    )
                  }
                  onNext={() => {
                    if (pagination.isDone || !pagination.nextCursor) return;
                    setCursors((stack) => [...stack, pagination.nextCursor]);
                  }}
                />
              </ListCardFooter>
            </>
          )}
        </div>
      )}

      <p className="text-xs text-text-3 text-right">
        <Link href="/transactions/upload" className="text-primary font-medium">
          {DROP_COPY.advancedTrouble}
        </Link>
      </p>

      {toast && (
        <ImportToast
          result={toast}
          onDismiss={() => setToast(null)}
          onFixReview={() => {
            setTriageOpen(true);
            setToast(null);
          }}
        />
      )}
      <TriageSheet
        open={triageOpen}
        onClose={() => setTriageOpen(false)}
        onCounts={setCounts}
      />
      <AddManualTransaction
        open={showManual}
        onClose={() => setShowManual(false)}
        onCreated={() => void fetchTransactions()}
      />
    </div>
  );
}
