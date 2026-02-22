'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Wallet, Plus, Search, ChevronRight } from 'lucide-react';

interface Expense {
  id: string;
  date: string;
  amount: number;
  currency: string;
  category_id: string | null;
  vendor: string | null;
  vat_amount: number;
  notes: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  is_custom: boolean;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categoryId: '',
  });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
      });
      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      if (res.ok) {
        setExpenses(data.expenses ?? []);
        setTotal(data.total ?? 0);
      } else {
        setError(data.error ?? 'Failed to load expenses');
      }
    } catch {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, filters.categoryId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetch('/api/expenses/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
    }).format(amount);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });

  const getCategoryName = (id: string | null) =>
    id ? categories.find((c) => c.id === id)?.name ?? '' : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="h-7 w-7 text-primary" />
          Expenses
        </h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="date"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={filters.startDate}
          onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
          placeholder="Start date"
        />
        <input
          type="date"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={filters.endDate}
          onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
          placeholder="End date"
        />
        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={filters.categoryId}
          onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No expenses found. Add one from the mobile app or create via API.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {expenses.map((exp) => (
              <li key={exp.id}>
                <Link
                  href={`/expenses/${exp.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {exp.vendor || 'No vendor'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(exp.date)}
                      {getCategoryName(exp.category_id) ? ` · ${getCategoryName(exp.category_id)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-primary">
                      {formatCurrency(exp.amount, exp.currency)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && expenses.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {expenses.length} of {total} expense(s).
        </p>
      )}
    </div>
  );
}
