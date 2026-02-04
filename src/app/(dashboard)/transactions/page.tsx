'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  category_id: string | null;
  user_id: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  user_id: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkUpdateResults, setBulkUpdateResults] = useState<Map<string, string>>(new Map());
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const supabase = createBrowserClient();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setIsAuthenticated(true);
      loadData();
    } catch (err) {
      console.error('Auth check failed:', err);
      router.push('/login');
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      // Load transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (txError) throw txError;

      // Load categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (catError) throw catError;

      setTransactions(txData || []);
      setCategories(catData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCategoryChange(transactionId: string, categoryId: string) {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: categoryId })
        .eq('id', transactionId);

      if (error) throw error;

      // Update local state
      setTransactions(prev =>
        prev.map(tx =>
          tx.id === transactionId ? { ...tx, category_id: categoryId } : tx
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update transaction');
    }
  }

  async function handleBulkCategoryUpdate(categoryMappings: Map<string, string>) {
    try {
      setIsUpdating(true);
      setError(null);
      const results = new Map<string, string>();

      let updated = 0;
      let skipped = 0;

      // ✅ FIXED: Use Array.from() to convert MapIterator to array
      // This prevents the TypeScript error: "MapIterator can only be iterated through when using '--downlevelIteration'"
      for (const [txId, catId] of Array.from(categoryMappings.entries())) {
        if (catId && categories.find(c => c.id === catId)) {
          const { error } = await supabase
            .from('transactions')
            .update({ category_id: catId })
            .eq('id', txId);

          if (!error) {
            updated++;
            results.set(txId, 'success');
          } else {
            console.error(`Failed to update transaction ${txId}:`, error);
            results.set(txId, 'error');
            skipped++;
          }
        } else {
          skipped++;
          results.set(txId, 'skipped');
        }
      }

      setBulkUpdateResults(results);
      
      // Reload data to reflect changes
      await loadData();

      alert(`Bulk update complete!\nUpdated: ${updated}\nSkipped: ${skipped}`);
    } catch (err: any) {
      setError(err.message || 'Failed to perform bulk update');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(transactionId: string) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions(prev => prev.filter(tx => tx.id !== transactionId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete transaction');
    }
  }

  function getCategoryName(categoryId: string | null): string {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  }

  if (!isAuthenticated || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Transactions</h1>
        <p className="text-gray-600">Manage your financial transactions</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="mb-4 flex gap-4">
        <button
          onClick={() => loadData()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          Refresh
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Back to Dashboard
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No transactions found</p>
          <p className="text-gray-400 mt-2">Add your first transaction to get started</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={transaction.category_id || ''}
                      onChange={(e) => handleCategoryChange(transaction.id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        Total transactions: {transactions.length}
      </div>
    </div>
  );
}
