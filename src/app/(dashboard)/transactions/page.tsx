'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: 'debit' | 'credit';
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
    search: '',
    type: '',
    startDate: '',
    endDate: '',
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filters]);

  const fetchTransactions = async () => {
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
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)));
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
      const response = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error deleting transactions:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
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
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      {/* Header */}
      <div className="bg-light-background dark:bg-dark-background border-b border-light-border dark:border-dark-border px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Transactions</h1>
            <span className="text-sm font-semibold text-light-text-tertiary dark:text-dark-text-tertiary bg-light-surface dark:bg-dark-surface px-3 py-1 rounded-full border border-light-border dark:border-dark-border">
              {pagination.total.toLocaleString()} TOTAL
            </span>
          </div>
          <div className="flex items-center gap-3">
          <Link
            href="/transactions/review"
            className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:border-primary-500 transition-all font-medium"
          >
            Review Uncategorized
          </Link>
          <div className="relative">
            <button
              onClick={() => document.getElementById('export-menu')?.classList.toggle('hidden')}
              disabled={exporting}
              className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:border-primary-500 transition-all font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-icons text-sm">file_download</span>
              {exporting ? 'Exporting...' : 'Export'}
            </button>
            <div id="export-menu" className="hidden absolute right-0 mt-2 w-48 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border shadow-xl z-10">
              <button
                onClick={() => { handleExport('csv'); document.getElementById('export-menu')?.classList.add('hidden'); }}
                className="block w-full text-left px-4 py-2 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover rounded-t-lg text-light-text-primary dark:text-dark-text-primary"
              >
                Export as CSV
              </button>
              <button
                onClick={() => { handleExport('json'); document.getElementById('export-menu')?.classList.add('hidden'); }}
                className="block w-full text-left px-4 py-2 hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover rounded-b-lg text-light-text-primary dark:text-dark-text-primary"
              >
                Export as JSON
              </button>
            </div>
          </div>
          <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl">
            <span className="material-icons">add</span>
            Add New
          </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <span className="material-icons absolute left-4 top-1/2 -translate-y-1/2 text-light-text-tertiary dark:text-dark-text-tertiary">search</span>
            <input
              type="text"
              placeholder="Search transactions, vendors, amounts..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg pl-12 pr-4 py-3 text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:border-primary-500 transition-all focus:outline-none focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:border-primary-500 transition-all focus:outline-none focus:border-primary-500"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="bg-dark-surface border border-dark-border rounded-lg px-4 py-3 text-dark-text-secondary hover:text-dark-primary hover:border-primary-500 transition-all focus:outline-none focus:border-primary-500"
          />
          <Link
            href="/transactions/upload"
            className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg px-4 py-3 text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:border-primary-500 transition-all font-medium whitespace-nowrap"
          >
            Upload
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 space-y-6">

        {selectedIds.size > 0 && (
          <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 flex items-center justify-between">
            <span className="text-primary-500 font-medium">
              {selectedIds.size} transaction{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="bg-error-500 hover:bg-error-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-light-text-tertiary dark:text-dark-text-tertiary">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">No transactions found</p>
              <Link
                href="/transactions/upload"
                className="text-primary-500 hover:text-primary-400 font-medium"
              >
                Upload your first bank statement →
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto p-6">
                <table className="w-full">
                  <thead className="border-b border-light-border dark:border-dark-border">
                    <tr>
                      <th className="px-4 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === transactions.length}
                          onChange={handleSelectAll}
                          className="rounded border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-primary-500 focus:ring-primary-500"
                        />
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">
                        Date
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">
                        Description
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">
                        Category
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-4 text-center text-xs font-semibold text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-border/50 dark:divide-dark-border/50">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover cursor-pointer transition-colors"
                        onClick={() => router.push(`/transactions/${transaction.id}`)}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(transaction.id)}
                            onChange={() => handleSelectOne(transaction.id)}
                            className="rounded border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-primary-500 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-light-text-primary dark:text-dark-text-primary font-medium">
                            {formatDate(transaction.transaction_date)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-light-background dark:bg-dark-background flex items-center justify-center">
                              <span className="material-icons text-primary-500 text-sm">
                                {transaction.transaction_type === 'credit' ? 'arrow_downward' : 'arrow_upward'}
                              </span>
                            </div>
                            <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                              {transaction.description}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {transaction.category ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success-500/10 text-success-500">
                              {transaction.category.name}
                              {transaction.confidence_score !== undefined && transaction.confidence_score < 100 && (
                                <span className="ml-1">
                                  ({transaction.confidence_score}%)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-light-text-tertiary dark:text-dark-text-tertiary text-xs">Uncategorized</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`font-semibold ${
                            transaction.transaction_type === 'credit' ? 'text-success-500' : 'text-light-text-primary dark:text-dark-text-primary'
                          }`}>
                            {transaction.transaction_type === 'credit' ? '+' : ''}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success-500/10 text-success-500">
                            {transaction.is_reconciled ? 'SUCCESSFUL' : 'PENDING'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button className="p-2 hover:bg-light-background dark:hover:bg-dark-background rounded-lg transition-colors">
                            <span className="material-icons text-light-text-tertiary dark:text-dark-text-tertiary">more_vert</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-light-border dark:border-dark-border px-4">
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total.toLocaleString()} entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="w-10 h-10 rounded-lg bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-icons">arrow_back</span>
                  </button>
                  <button className="w-10 h-10 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors">
                    {pagination.page}
                  </button>
                  {pagination.page < pagination.totalPages - 1 && (
                    <span className="text-light-text-tertiary dark:text-dark-text-tertiary px-2">...</span>
                  )}
                  {pagination.page < pagination.totalPages && (
                    <button className="w-10 h-10 rounded-lg bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors">
                      {pagination.totalPages}
                    </button>
                  )}
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="w-10 h-10 rounded-lg bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-icons">arrow_forward</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
