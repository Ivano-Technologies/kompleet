'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface DuplicateCandidate {
  id: string;
  session_id: string;
  existing_transaction_id: string;
  new_transaction_data: {
    date: string;
    merchant: string;
    amount: number;
    type: 'debit' | 'credit';
    balance: number;
    reference?: string;
    metadata?: Record<string, unknown>;
  };
  similarity_score: number;
  match_factors: Record<string, number>;
  status: string;
  import_sessions: {
    file_name: string;
    bank_code: string;
  };
}

export default function DuplicateResolutionPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Record<string, string>>({});

  const fetchDuplicates = useCallback(async () => {
    try {
      const url = sessionId
        ? `/api/transactions/duplicates?sessionId=${sessionId}`
        : '/api/transactions/duplicates';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setDuplicates(data.duplicates || []);
      }
    } catch (error) {
      console.error('Error fetching duplicates:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  const handleResolve = async (
    duplicateId: string,
    action: 'merged' | 'kept_both' | 'rejected'
  ) => {
    setResolving(duplicateId);

    try {
      const res = await fetch('/api/transactions/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duplicateId, action }),
      });

      if (res.ok) {
        setResolved((prev) => ({ ...prev, [duplicateId]: action }));
        // Remove from list after brief delay to show feedback
        setTimeout(() => {
          setDuplicates((prev) => prev.filter((d) => d.id !== duplicateId));
        }, 800);
      }
    } catch (error) {
      console.error('Error resolving duplicate:', error);
    } finally {
      setResolving(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getSimilarityColor = (score: number) => {
    if (score >= 0.95) return 'text-red-600 bg-red-50';
    if (score >= 0.85) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading duplicates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/transactions"
          className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
        >
          &larr; Back to Transactions
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Resolve Duplicates</h1>
        <p className="text-gray-600 mt-2">
          {duplicates.length > 0
            ? `${duplicates.length} potential duplicate${duplicates.length !== 1 ? 's' : ''} found`
            : 'No pending duplicates'}
          {sessionId && ' for this import session'}
        </p>
      </div>

      {/* Empty State */}
      {duplicates.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
          <div className="text-5xl mb-4">&#10003;</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">No Duplicates</h2>
          <p className="text-green-700 mb-6">
            All duplicate candidates have been resolved.
          </p>
          <Link
            href="/transactions"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block font-medium"
          >
            View All Transactions
          </Link>
        </div>
      )}

      {/* Duplicate Cards */}
      <div className="space-y-4">
        {duplicates.map((dup) => {
          const isResolved = resolved[dup.id];
          const isResolving = resolving === dup.id;

          return (
            <div
              key={dup.id}
              className={`bg-white rounded-lg border ${
                isResolved
                  ? 'border-green-300 bg-green-50 opacity-60'
                  : 'border-gray-200'
              } overflow-hidden transition-all`}
            >
              {/* Similarity Badge */}
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${getSimilarityColor(
                      dup.similarity_score
                    )}`}
                  >
                    {Math.round(dup.similarity_score * 100)}% match
                  </span>
                  <span className="text-sm text-gray-500">
                    from {dup.import_sessions?.file_name || 'unknown import'}
                  </span>
                </div>
                {isResolved && (
                  <span className="text-sm font-medium text-green-600">
                    {isResolved === 'merged'
                      ? 'Merged'
                      : isResolved === 'kept_both'
                        ? 'Both Kept'
                        : 'Rejected'}
                  </span>
                )}
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                {/* Existing Transaction */}
                <div className="p-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Existing Transaction
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    ID: {dup.existing_transaction_id.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Already in your transaction list
                  </p>
                </div>

                {/* New Transaction */}
                <div className="p-4">
                  <div className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">
                    New (Imported)
                  </div>
                  <p className="font-medium text-gray-900">
                    {dup.new_transaction_data.merchant}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">
                      {formatDate(dup.new_transaction_data.date)}
                    </span>
                    <span className="text-sm text-gray-300">&middot;</span>
                    <span
                      className={`text-sm font-semibold ${
                        dup.new_transaction_data.type === 'credit'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {dup.new_transaction_data.type === 'credit' ? '+' : '-'}
                      {formatCurrency(dup.new_transaction_data.amount)}
                    </span>
                  </div>
                  {dup.new_transaction_data.reference && (
                    <p className="text-xs text-gray-400 mt-1">
                      Ref: {dup.new_transaction_data.reference}
                    </p>
                  )}
                </div>
              </div>

              {/* Match Factors */}
              {dup.match_factors && (
                <div className="px-6 py-2 bg-gray-50 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dup.match_factors).map(([factor, score]) => (
                      <span
                        key={factor}
                        className="text-xs px-2 py-0.5 bg-white rounded border border-gray-200 text-gray-600"
                      >
                        {factor}: {typeof score === 'number' ? Math.round(score * 100) : score}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!isResolved && (
                <div className="px-6 py-3 border-t border-gray-200 flex gap-3 justify-end">
                  <button
                    onClick={() => handleResolve(dup.id, 'rejected')}
                    disabled={isResolving}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    Reject New
                  </button>
                  <button
                    onClick={() => handleResolve(dup.id, 'kept_both')}
                    disabled={isResolving}
                    className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    Keep Both
                  </button>
                  <button
                    onClick={() => handleResolve(dup.id, 'merged')}
                    disabled={isResolving}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {isResolving ? 'Merging...' : 'Merge'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk Actions */}
      {duplicates.length > 3 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {duplicates.length} duplicates remaining
          </p>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                for (const dup of duplicates) {
                  await handleResolve(dup.id, 'rejected');
                }
              }}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Reject All New
            </button>
            <button
              onClick={async () => {
                for (const dup of duplicates) {
                  await handleResolve(dup.id, 'merged');
                }
              }}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Merge All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
