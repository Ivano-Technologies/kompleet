"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
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
}

function isUncategorized(transaction: Transaction): boolean {
  if (!transaction.category) return true;
  return (
    typeof transaction.confidence_score === "number" &&
    transaction.confidence_score < 80
  );
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
  });
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
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [duplicatesCount, setDuplicatesCount] = useState(0);
  const [showManual, setShowManual] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
      });

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      if (response.ok) {
        const rows = data.transactions as Transaction[];
        setTransactions(rows);
        setPagination(data.pagination);
        const pageUncategorized = rows.filter(isUncategorized).length;
        setUncategorizedCount((current) =>
          current > 0 ? Math.max(current, pageUncategorized) : pageUncategorized,
        );
        setError(null);
      } else {
        setError(data.error || "Failed to load transactions");
      }
    } catch (fetchError) {
      console.error("Error fetching transactions:", fetchError);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    let cancelled = false;
    const year = new Date().getFullYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    (async () => {
      try {
        const [dupRes, summaryRes] = await Promise.all([
          fetch("/api/transactions/duplicates", { credentials: "include" }),
          fetch(
            `/api/transactions/summary?startDate=${startDate}&endDate=${endDate}`,
            { credentials: "include" },
          ),
        ]);
        if (cancelled) return;
        if (dupRes.ok) {
          const body = (await dupRes.json()) as { total?: number };
          setDuplicatesCount(body.total ?? 0);
        }
        if (summaryRes.ok) {
          const body = (await summaryRes.json()) as { uncategorized?: number };
          if (typeof body.uncategorized === "number") {
            setUncategorizedCount(body.uncategorized);
          }
        }
      } catch {
        /* optional health chips */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast, pagination.total]);

  const handleSuccess = useCallback(
    (result: StatementUploadResult) => {
      setToast(result);
      if (result.pendingReview > 0) setUncategorizedCount(result.pendingReview);
      if (result.duplicates > 0) setDuplicatesCount(result.duplicates);
      void fetchTransactions();
    },
    [fetchTransactions],
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
        setError(data.error || "Failed to delete transactions");
      }
    } catch (deleteError) {
      console.error("Error deleting transactions:", deleteError);
      setError("Failed to delete transactions. Please try again.");
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
        setError(data.error || "Export failed");
      }
    } catch (exportError) {
      console.error("Export error:", exportError);
      setError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const isEmpty = !loading && pagination.total === 0 && !filters.search && !filters.type;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg flex justify-between items-center">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
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
          <span className="text-xs font-medium text-text-3 bg-surface px-2.5 py-1 rounded-full border border-border">
            {pagination.total.toLocaleString()} total
          </span>
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
        uncategorizedCount={uncategorizedCount}
        duplicatesCount={duplicatesCount}
      />

      {isEmpty ? (
        <StatementDropZone
          variant="hero"
          inputId={booksInputId}
          showWhy={false}
          title={DROP_COPY.heroTitle}
          subtitle={DROP_COPY.heroSub}
          onSuccess={handleSuccess}
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
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-1 placeholder-text-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="px-3 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
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
            <div className="p-10 text-center text-sm text-text-3">
              No transactions match these filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-5 py-3 text-left w-10">
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
                      <th className="px-5 py-3 text-left text-xs font-medium text-text-3">
                        Date
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-text-3">
                        Description
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-text-3 hidden md:table-cell">
                        Category
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-text-3">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-medium text-text-3 hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-medium text-text-3 w-10"></th>
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
                          className="px-5 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(transaction.id)}
                            onChange={() => handleSelectOne(transaction.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="px-5 py-3.5 text-text-2 text-xs">
                          {formatDate(transaction.transaction_date)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {transaction.transaction_type === "credit" ? (
                                <ArrowDown className="w-3.5 h-3.5 text-success" />
                              ) : (
                                <ArrowUp className="w-3.5 h-3.5 text-error" />
                              )}
                            </div>
                            <span className="font-medium text-sm text-text-1 truncate">
                              {transaction.description}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
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
                        <td className="px-5 py-3.5 text-right">
                          <span
                            className={`font-semibold text-sm ${
                              transaction.transaction_type === "credit"
                                ? "text-success"
                                : "text-text-1"
                            }`}
                          >
                            {transaction.transaction_type === "credit" ? "+" : ""}
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center hidden sm:table-cell">
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
                          className="px-5 py-3.5 text-center"
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

              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-xs text-text-3">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                  of {pagination.total.toLocaleString()} entries
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page - 1 })
                    }
                    disabled={pagination.page === 1}
                    className="p-1.5 rounded-md hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-xs font-medium bg-primary text-white rounded-md">
                    {pagination.page}
                  </span>
                  {pagination.totalPages > 1 &&
                    pagination.page < pagination.totalPages && (
                      <>
                        {pagination.page < pagination.totalPages - 1 && (
                          <span className="text-xs text-text-3 px-1">...</span>
                        )}
                        <button
                          onClick={() =>
                            setPagination({
                              ...pagination,
                              page: pagination.totalPages,
                            })
                          }
                          className="px-3 py-1 text-xs rounded-md hover:bg-surface-2 transition-colors"
                        >
                          {pagination.totalPages}
                        </button>
                      </>
                    )}
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, page: pagination.page + 1 })
                    }
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded-md hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <p className="text-xs text-text-3 text-right">
        <Link href="/transactions/upload" className="text-primary font-medium">
          {DROP_COPY.advancedTrouble}
        </Link>
      </p>

      {toast && <ImportToast result={toast} onDismiss={() => setToast(null)} />}
      <AddManualTransaction
        open={showManual}
        onClose={() => setShowManual(false)}
        onCreated={() => void fetchTransactions()}
      />
    </div>
  );
}
