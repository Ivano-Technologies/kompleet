"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreVertical,
  Plus,
  Search,
  Upload,
} from "lucide-react";

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

export default function TransactionsPage() {
  const router = useRouter();
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

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.type && { type: filters.type }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions);
        setPagination(data.pagination);
        setError(null);
      } else {
        setError(data.error || "Failed to load transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
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
    } catch (error) {
      console.error("Error deleting transactions:", error);
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
        ...(filters.type && { type: filters.type }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
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
    } catch (error) {
      console.error("Export error:", error);
      setError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Transactions
          </h1>
          <span className="text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary bg-light-surface dark:bg-dark-surface px-2.5 py-1 rounded-full border border-light-border dark:border-dark-border">
            {pagination.total.toLocaleString()} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/transactions/review"
            className="btn-secondary text-sm px-3 py-2 hidden lg:flex items-center gap-1.5"
          >
            Review Uncategorized
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? "Exporting..." : "Export"}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border shadow-lg z-20">
                <button
                  onClick={() => handleExport("csv")}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover rounded-t-lg text-light-text-primary dark:text-dark-text-primary"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport("json")}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover rounded-b-lg text-light-text-primary dark:text-dark-text-primary"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>
          <Link
            href="/transactions/add-from-receipt"
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" /> Add from receipt
          </Link>
          <Link
            href="/transactions/upload"
            className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Upload
          </Link>
          <button className="btn-primary text-sm px-3 py-2 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add New
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-light-text-tertiary dark:text-dark-text-tertiary" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="px-3 py-2.5 text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-light-text-secondary dark:text-dark-text-secondary focus:outline-none focus:border-primary-500"
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
          className="px-3 py-2.5 text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-light-text-secondary dark:text-dark-text-secondary focus:outline-none focus:border-primary-500"
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="px-3 py-2.5 text-sm bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg text-light-text-secondary dark:text-dark-text-secondary focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-primary-500 font-medium">
            {selectedIds.size} transaction{selectedIds.size !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              Loading transactions...
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-3">
              No transactions found
            </p>
            <Link
              href="/transactions/upload"
              className="text-primary-500 hover:text-primary-400 text-sm font-medium"
            >
              Upload your first bank statement →
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border">
                    <th className="px-5 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size === transactions.length &&
                          transactions.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-light-border dark:border-dark-border"
                      />
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary">
                      Date
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary">
                      Description
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary hidden md:table-cell">
                      Category
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary hidden sm:table-cell">
                      Status
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-light-border/50 dark:border-dark-border/50 last:border-0 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover cursor-pointer transition-colors"
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
                          className="rounded border-light-border dark:border-dark-border"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-light-text-secondary dark:text-dark-text-secondary text-xs">
                        {formatDate(transaction.transaction_date)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                            {transaction.transaction_type === "credit" ? (
                              <ArrowDown className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowUp className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                            )}
                          </div>
                          <span className="font-medium text-sm text-light-text-primary dark:text-dark-text-primary truncate">
                            {transaction.description}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        {transaction.category ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            {transaction.category.name}
                            {transaction.confidence_score !== undefined &&
                              transaction.confidence_score < 100 && (
                                <span className="ml-1 opacity-60">
                                  ({transaction.confidence_score}%)
                                </span>
                              )}
                          </span>
                        ) : (
                          <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                            Uncategorized
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`font-semibold text-sm ${
                            transaction.transaction_type === "credit"
                              ? "text-green-600 dark:text-green-400"
                              : "text-light-text-primary dark:text-dark-text-primary"
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
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {transaction.is_reconciled ? "Reconciled" : "Pending"}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="p-1.5 hover:bg-light-background dark:hover:bg-dark-background rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-light-text-tertiary dark:text-dark-text-tertiary" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-light-border dark:border-dark-border">
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
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
                  className="p-1.5 rounded-md hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-xs font-medium bg-primary-500 text-white rounded-md">
                  {pagination.page}
                </span>
                {pagination.totalPages > 1 &&
                  pagination.page < pagination.totalPages && (
                    <>
                      {pagination.page < pagination.totalPages - 1 && (
                        <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary px-1">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() =>
                          setPagination({
                            ...pagination,
                            page: pagination.totalPages,
                          })
                        }
                        className="px-3 py-1 text-xs rounded-md hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
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
                  className="p-1.5 rounded-md hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
