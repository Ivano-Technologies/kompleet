'use client';

import React, { useState } from 'react';
import { ChevronDown, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TransactionReviewCardProps {
  transactionId: string;
  date: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  counterparty?: string;
  currency?: string;
  predictedCategory: string;
  confidence: number;
  alternatives?: Array<{ category: string; confidence: number }>;
  onAccept: (category: string) => Promise<void>;
  onReject: (category: string, reason?: string) => Promise<void>;
  categories: string[];
}

export default function TransactionReviewCard({
  transactionId,
  date,
  amount,
  type,
  description,
  counterparty,
  currency = 'NGN',
  predictedCategory,
  confidence,
  alternatives = [],
  onAccept,
  onReject,
  categories,
}: TransactionReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(predictedCategory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      await onAccept(selectedCategory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(predictedCategory, selectedCategory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setIsLoading(false);
    }
  };

  const confidenceColor =
    confidence >= 0.8
      ? 'text-green-600 dark:text-green-400'
      : confidence >= 0.6
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  const confidenceLabel =
    confidence >= 0.8
      ? 'High confidence'
      : confidence >= 0.6
        ? 'Medium confidence'
        : 'Low confidence';

  return (
    <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">{date}</p>
              <span
                className={`text-sm font-semibold px-2 py-1 rounded ${
                  type === 'debit'
                    ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                    : 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                }`}
              >
                {type === 'debit' ? '−' : '+'} ₦{amount.toLocaleString()}
              </span>
            </div>
            <p className="font-medium text-slate-900 dark:text-white">{description}</p>
            {counterparty && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{counterparty}</p>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <ChevronDown
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Category prediction */}
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">AI Prediction</p>
              <p className="font-semibold text-slate-900 dark:text-white">{predictedCategory}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${confidenceColor}`}>
                {(confidence * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{confidenceLabel}</p>
            </div>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mb-4 space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700">
            {/* Alternative categories */}
            {alternatives.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Alternative suggestions:
                </p>
                <div className="space-y-2">
                  {alternatives.slice(0, 3).map((alt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {alt.category}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {(alt.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual category selection */}
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400 mb-2 block">
                Select category:
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="w-4 h-4 mr-2" />
            Accept
          </Button>
          <Button
            onClick={handleReject}
            disabled={isLoading || selectedCategory === predictedCategory}
            variant="outline"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Correct
          </Button>
        </div>
      </div>
    </Card>
  );
}
