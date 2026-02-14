'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
    tax_treatment: string;
  };
  confidence_score?: number;
  reference?: string;
  notes?: string;
  source?: string;
  is_reconciled: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  category_type: string;
  tax_treatment: string;
}

export default function TransactionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    transaction_type: 'debit' as 'debit' | 'credit',
    transaction_date: '',
    category_id: '',
    notes: '',
    is_reconciled: false,
  });

  useEffect(() => {
    fetchTransaction();
    fetchCategories();
  }, [id]);

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/transactions/${id}`);
      const data = await response.json();

      if (response.ok && data.transaction) {
        setTransaction(data.transaction);
        setFormData({
          description: data.transaction.description,
          amount: data.transaction.amount.toString(),
          transaction_type: data.transaction.transaction_type,
          transaction_date: data.transaction.transaction_date,
          category_id: data.transaction.category?.id || '',
          notes: data.transaction.notes || '',
          is_reconciled: data.transaction.is_reconciled,
        });
      } else {
        setError('Transaction not found');
      }
    } catch (err) {
      setError('Failed to load transaction');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          amount: parseFloat(formData.amount),
          transaction_type: formData.transaction_type,
          transaction_date: formData.transaction_date,
          category_id: formData.category_id || null,
          notes: formData.notes,
          is_reconciled: formData.is_reconciled,
        }),
      });

      if (response.ok) {
        await fetchTransaction();
        setEditing(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save transaction');
      }
    } catch (err) {
      setError('Failed to save transaction');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/transactions');
      } else {
        setError('Failed to delete transaction');
      }
    } catch (err) {
      setError('Failed to delete transaction');
      console.error(err);
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
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-4">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error}</p>
          <Link
            href="/transactions"
            className="text-green-600 hover:text-green-700 font-medium mt-4 inline-block"
          >
            ← Back to Transactions
          </Link>
        </div>
      </div>
    );
  }

  if (!transaction) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/transactions"
          className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
        >
          ← Back to Transactions
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Transaction Details</h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
              {formatDate(transaction.transaction_date)}
            </p>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                  }}
                  disabled={saving}
                  className="bg-light-text-tertiary dark:bg-dark-text-tertiary text-white px-4 py-2 rounded-lg hover:bg-dark-surface transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Transaction Details */}
      <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6 space-y-6">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Amount
          </label>
          {editing ? (
            <div className="flex gap-4">
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as 'debit' | 'credit' })}
                className="px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="debit">Debit (-)</option>
                <option value="credit">Credit (+)</option>
              </select>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                step="0.01"
                className="flex-1 px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          ) : (
            <div className={`text-3xl font-bold ${
              transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.transaction_type === 'credit' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Description
          </label>
          {editing ? (
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          ) : (
            <p className="text-light-text-primary dark:text-dark-text-primary">{transaction.description}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Date
          </label>
          {editing ? (
            <input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          ) : (
            <p className="text-light-text-primary dark:text-dark-text-primary">{formatDate(transaction.transaction_date)}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Category
          </label>
          {editing ? (
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.category_type})
                </option>
              ))}
            </select>
          ) : transaction.category ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {transaction.category.name}
              </span>
              <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                {transaction.category.category_type} • {transaction.category.tax_treatment}
              </span>
              {transaction.confidence_score !== undefined && transaction.confidence_score < 100 && (
                <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                  ({transaction.confidence_score}% confidence)
                </span>
              )}
            </div>
          ) : (
            <p className="text-light-text-tertiary dark:text-dark-text-tertiary">Uncategorized</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Notes
          </label>
          {editing ? (
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Add notes about this transaction..."
            />
          ) : transaction.notes ? (
            <p className="text-light-text-primary dark:text-dark-text-primary">{transaction.notes}</p>
          ) : (
            <p className="text-light-text-tertiary dark:text-dark-text-tertiary">No notes</p>
          )}
        </div>

        {/* Reconciled */}
        <div className="flex items-center">
          {editing ? (
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_reconciled}
                onChange={(e) => setFormData({ ...formData, is_reconciled: e.target.checked })}
                className="rounded border-light-border dark:border-dark-border text-green-600 focus:ring-green-500 mr-2"
              />
              <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Mark as reconciled</span>
            </label>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Reconciled:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                transaction.is_reconciled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary'
              }`}>
                {transaction.is_reconciled ? 'Yes' : 'No'}
              </span>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="pt-6 border-t border-light-border dark:border-dark-border space-y-2">
          {transaction.balance !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">Balance after transaction:</span>
              <span className="font-medium text-light-text-primary dark:text-dark-text-primary">{formatCurrency(transaction.balance)}</span>
            </div>
          )}
          {transaction.reference && (
            <div className="flex justify-between text-sm">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">Reference:</span>
              <span className="font-medium text-light-text-primary dark:text-dark-text-primary">{transaction.reference}</span>
            </div>
          )}
          {transaction.source && (
            <div className="flex justify-between text-sm">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">Source:</span>
              <span className="font-medium text-light-text-primary dark:text-dark-text-primary">{transaction.source}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-light-text-secondary dark:text-dark-text-secondary">Created:</span>
            <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
              {new Date(transaction.created_at).toLocaleString('en-NG')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
