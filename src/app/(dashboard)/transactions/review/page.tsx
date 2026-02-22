"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "debit" | "credit";
  category?: {
    id: string;
    name: string;
  };
  confidence_score?: number;
}

interface Category {
  id: string;
  name: string;
  category_type: string;
  tax_treatment: string;
}

interface SuggestedCategory {
  category: Category;
  confidence: number;
  reason: string;
}

export default function TransactionReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<SuggestedCategory[]>([]);
  const [customCategoryId, setCustomCategoryId] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUncategorizedTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        uncategorized: "true",
        limit: "100",
      });
      if (sessionId) params.set("sessionId", sessionId);
      const response = await fetch(`/api/transactions?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        const uncategorized = data.transactions.filter(
          (t: Transaction) =>
            !t.category ||
            (t.confidence_score !== undefined && t.confidence_score < 80),
        );
        setTransactions(uncategorized);
        setError(null);
      } else {
        setError(data.error || "Failed to load transactions for review");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchUncategorizedTransactions();
    fetchCategories();
  }, [fetchUncategorizedTransactions, fetchCategories]);

  const generateSuggestions = (transaction: Transaction) => {
    if (!transaction) return;

    const desc = transaction.description.toLowerCase();
    const suggested: SuggestedCategory[] = [];

    categories.forEach((category) => {
      let confidence = 0;
      const reasons: string[] = [];

      // Check if category name appears in description
      if (desc.includes(category.name.toLowerCase())) {
        confidence += 40;
        reasons.push(`Contains "${category.name}"`);
      }

      // Simple keyword matching based on common patterns
      const keywords: Record<string, string[]> = {
        "Sales Revenue": ["payment from", "invoice", "sales", "revenue"],
        "Service Income": ["consulting", "service", "professional"],
        "Salaries & Wages": ["salary", "wages", "payroll", "staff"],
        "Rent Expense": ["rent", "lease"],
        Utilities: ["electricity", "water", "internet", "phone"],
        "Office Supplies": ["supplies", "stationery", "office"],
        "Marketing & Advertising": ["marketing", "advertising", "promotion"],
        "Professional Fees": [
          "accountant",
          "lawyer",
          "consultant",
          "professional",
        ],
        "Travel & Transport": ["fuel", "transport", "travel", "taxi"],
        "Bank Charges": ["bank charges", "bank fee", "transfer charges"],
        Insurance: ["insurance", "premium"],
        "Equipment Purchase": ["equipment", "laptop", "computer", "machinery"],
      };

      const categoryKeywords = keywords[category.name] || [];
      categoryKeywords.forEach((keyword) => {
        if (desc.includes(keyword)) {
          confidence += 30;
          reasons.push(`Matches "${keyword}"`);
        }
      });

      // Transaction type matching
      if (
        transaction.transaction_type === "credit" &&
        category.category_type === "income"
      ) {
        confidence += 20;
        reasons.push("Credit transaction suggests income");
      } else if (
        transaction.transaction_type === "debit" &&
        category.category_type === "expense"
      ) {
        confidence += 20;
        reasons.push("Debit transaction suggests expense");
      }

      if (confidence > 0) {
        suggested.push({
          category,
          confidence: Math.min(confidence, 95),
          reason: reasons.join(", "),
        });
      }
    });

    // Sort by confidence
    suggested.sort((a, b) => b.confidence - a.confidence);
    setSuggestions(suggested.slice(0, 3));
  };

  const handleAcceptSuggestion = async (categoryId: string) => {
    await categorizeTransaction(categoryId);
  };

  const handleCustomCategory = async () => {
    if (!customCategoryId) return;
    await categorizeTransaction(customCategoryId);
  };

  const categorizeTransaction = async (categoryId: string) => {
    setProcessing(true);
    try {
      const transaction = transactions[currentIndex];
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: categoryId,
          confidence_score: 100, // Manual categorization = 100% confidence
        }),
      });

      if (response.ok) {
        // Move to next transaction
        if (currentIndex < transactions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setCustomCategoryId("");
        } else {
          // All done!
          router.push("/transactions");
        }
      }
    } catch (error) {
      console.error("Error categorizing transaction:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex < transactions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCustomCategoryId("");
    } else {
      router.push("/transactions");
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-4">
            Loading transactions...
          </p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/transactions"
          className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
        >
          ← Back to Transactions
        </Link>
        <div className="bg-green-50 border border-green-200 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            All Caught Up!
          </h2>
          <p className="text-green-700 mb-6">
            All your transactions are categorized or have high confidence
            scores.
          </p>
          <Link
            href="/transactions"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block font-medium"
          >
            View All Transactions
          </Link>
        </div>
      </div>
    );
  }

  const currentTransaction = transactions[currentIndex];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg flex justify-between items-center">
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
      <div className="mb-6">
        <Link
          href="/transactions"
          className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
        >
          ← Back to Transactions
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Review Transactions
            </h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
              {currentIndex + 1} of {transactions.length} transactions to review
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Progress
            </div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((currentIndex / transactions.length) * 100)}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-light-background dark:bg-dark-background rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / transactions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Transaction */}
      <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
              {currentTransaction.description}
            </h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {formatDate(currentTransaction.transaction_date)}
            </p>
          </div>
          <div
            className={`text-2xl font-bold ${
              currentTransaction.transaction_type === "credit"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {currentTransaction.transaction_type === "credit" ? "+" : "-"}
            {formatCurrency(currentTransaction.amount)}
          </div>
        </div>

        {currentTransaction.category && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Currently categorized as{" "}
              <strong>{currentTransaction.category.name}</strong>
              {currentTransaction.confidence_score !== undefined && (
                <span>
                  {" "}
                  ({currentTransaction.confidence_score}% confidence)
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Suggested Categories */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
            Suggested Categories
          </h3>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.category.id}
                onClick={() => handleAcceptSuggestion(suggestion.category.id)}
                disabled={processing}
                className="w-full bg-light-surface dark:bg-dark-surface border-2 border-light-border dark:border-dark-border rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                      {suggestion.category.name}
                    </div>
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {suggestion.category.category_type} •{" "}
                      {suggestion.category.tax_treatment}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-green-600">
                      {suggestion.confidence}% match
                    </div>
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  {suggestion.reason}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Category Selection */}
      <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
          Or Choose a Category
        </h3>
        <div className="flex gap-3">
          <select
            value={customCategoryId}
            onChange={(e) => setCustomCategoryId(e.target.value)}
            className="flex-1 px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select a category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.category_type})
              </option>
            ))}
          </select>
          <button
            onClick={handleCustomCategory}
            disabled={!customCategoryId || processing}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={handleSkip}
          disabled={processing}
          className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:text-dark-text-primary font-medium disabled:opacity-50"
        >
          Skip for now →
        </button>
        <div className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
          {transactions.length - currentIndex - 1} remaining
        </div>
      </div>
    </div>
  );
}
