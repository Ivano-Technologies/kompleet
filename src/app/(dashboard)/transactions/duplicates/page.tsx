"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

interface DuplicateCandidate {
  id: string;
  session_id: string;
  existing_transaction_id: string;
  new_transaction_data: {
    date: string;
    merchant: string;
    amount: number;
    type: "debit" | "credit";
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
  const sessionId = searchParams.get("sessionId");

  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Record<string, string>>({});

  const fetchDuplicates = useCallback(async () => {
    try {
      const url = sessionId
        ? `/api/transactions/duplicates?sessionId=${sessionId}`
        : "/api/transactions/duplicates";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setDuplicates(data.duplicates || []);
      }
    } catch (error) {
      console.error("Error fetching duplicates:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchDuplicates();
  }, [fetchDuplicates]);

  const handleResolve = async (
    duplicateId: string,
    action: "merged" | "kept_both" | "rejected",
  ) => {
    setResolving(duplicateId);

    try {
      const res = await fetch("/api/transactions/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateId, action }),
      });

      if (res.ok) {
        setResolved((prev) => ({ ...prev, [duplicateId]: action }));
        setTimeout(() => {
          setDuplicates((prev) => prev.filter((d) => d.id !== duplicateId));
        }, 800);
      }
    } catch (error) {
      console.error("Error resolving duplicate:", error);
    } finally {
      setResolving(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getSimilarityColor = (score: number) => {
    if (score >= 0.95)
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
    if (score >= 0.85)
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20";
    return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-500" />
          <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">
            Loading duplicates...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/transactions"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <ArrowLeft size={16} />
          Back to Transactions
        </Link>
        <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
          Resolve Duplicates
        </h1>
        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
          {duplicates.length > 0
            ? `${duplicates.length} potential duplicate${duplicates.length !== 1 ? "s" : ""} found`
            : "No pending duplicates"}
          {sessionId && " for this import session"}
        </p>
      </div>

      {/* Empty State */}
      {duplicates.length === 0 && (
        <div className="rounded-xl border border-light-border bg-light-surface p-12 text-center dark:border-dark-border dark:bg-dark-surface">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-primary-500" />
          <h2 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            No Duplicates
          </h2>
          <p className="mb-6 mt-2 text-light-text-secondary dark:text-dark-text-secondary">
            All duplicate candidates have been resolved.
          </p>
          <Link href="/transactions" className="btn-primary">
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
              className={`rounded-xl border bg-light-surface dark:bg-dark-surface transition-all ${
                isResolved
                  ? "border-primary-300 bg-primary-50/50 opacity-60 dark:border-primary-700 dark:bg-primary-900/20"
                  : "border-light-border dark:border-dark-border"
              }`}
            >
              {/* Similarity Badge */}
              <div className="flex items-center justify-between border-b border-light-border bg-light-background px-5 py-3 dark:border-dark-border dark:bg-dark-background">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${getSimilarityColor(
                      dup.similarity_score,
                    )}`}
                  >
                    {Math.round(dup.similarity_score * 100)}% match
                  </span>
                  <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                    from {dup.import_sessions?.file_name || "unknown import"}
                  </span>
                </div>
                {isResolved && (
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    {isResolved === "merged"
                      ? "Merged"
                      : isResolved === "kept_both"
                        ? "Both Kept"
                        : "Rejected"}
                  </span>
                )}
              </div>

              {/* Side-by-Side Comparison */}
              <div className="grid grid-cols-2 divide-x divide-light-border dark:divide-dark-border">
                {/* Existing Transaction */}
                <div className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary">
                    Existing Transaction
                  </div>
                  <p className="mt-2 truncate text-sm italic text-light-text-secondary dark:text-dark-text-secondary">
                    ID: {dup.existing_transaction_id}
                  </p>
                  <p className="mt-1 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                    Already in your transaction list
                  </p>
                </div>

                {/* New Transaction */}
                <div className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                    New (Imported)
                  </div>
                  <p className="mt-2 font-medium text-light-text-primary dark:text-dark-text-primary">
                    {dup.new_transaction_data.merchant}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {formatDate(dup.new_transaction_data.date)}
                    </span>
                    <span className="text-light-text-tertiary dark:text-dark-text-tertiary">
                      &middot;
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        dup.new_transaction_data.type === "credit"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {dup.new_transaction_data.type === "credit" ? "+" : "-"}
                      {formatCurrency(dup.new_transaction_data.amount)}
                    </span>
                  </div>
                  {dup.new_transaction_data.reference && (
                    <p className="mt-1 truncate text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                      Ref: {dup.new_transaction_data.reference}
                    </p>
                  )}
                </div>
              </div>

              {/* Match Factors */}
              {dup.match_factors && (
                <div className="border-t border-light-border bg-light-background px-5 py-2 dark:border-dark-border dark:bg-dark-background">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(dup.match_factors).map(
                      ([factor, score]) => (
                        <span
                          key={factor}
                          className="rounded border border-light-border bg-light-surface px-2 py-0.5 text-xs text-light-text-secondary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-secondary"
                        >
                          {factor}:{" "}
                          {typeof score === "number"
                            ? Math.round(score * 100)
                            : score}
                          %
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!isResolved && (
                <div className="flex justify-end gap-3 border-t border-light-border px-5 py-3 dark:border-dark-border">
                  <button
                    onClick={() => handleResolve(dup.id, "rejected")}
                    disabled={isResolving}
                    className="btn-secondary bg-transparent text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20"
                  >
                    Reject New
                  </button>
                  <button
                    onClick={() => handleResolve(dup.id, "kept_both")}
                    disabled={isResolving}
                    className="btn-secondary"
                  >
                    Keep Both
                  </button>
                  <button
                    onClick={() => handleResolve(dup.id, "merged")}
                    disabled={isResolving}
                    className="btn-primary"
                  >
                    {isResolving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Merging...
                      </>
                    ) : (
                      "Merge"
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk Actions */}
      {duplicates.length > 3 && (
        <div className="mt-6 flex items-center justify-between rounded-lg bg-light-background p-4 dark:bg-dark-background">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {duplicates.length} duplicates remaining
          </p>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                for (const dup of duplicates) {
                  await handleResolve(dup.id, "rejected");
                }
              }}
              className="btn-secondary bg-transparent text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20"
            >
              Reject All New
            </button>
            <button
              onClick={async () => {
                for (const dup of duplicates) {
                  await handleResolve(dup.id, "merged");
                }
              }}
              className="btn-primary"
            >
              Merge All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
