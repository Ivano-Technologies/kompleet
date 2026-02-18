'use client';

import React from 'react';
import { CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UploadSuccessProps {
  transactionCount: number;
  onReview: () => void;
  onUploadAnother: () => void;
}

export default function UploadSuccess({
  transactionCount,
  onReview,
  onUploadAnother,
}: UploadSuccessProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20">
        <div className="p-8 sm:p-12">
          {/* Success icon */}
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400 animate-pulse" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
            Statement imported successfully
          </h2>

          {/* Transaction count */}
          <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
            We found <span className="font-semibold text-slate-900 dark:text-white">{transactionCount}</span>{' '}
            transaction{transactionCount !== 1 ? 's' : ''}.
          </p>

          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Date range</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Feb 1 - Feb 18, 2026</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total debit</p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">₦2,450,000</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total credit</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">₦3,100,000</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Net</p>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">+₦650,000</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={onReview}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-6"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Review and categorize transactions
            </Button>

            <p className="text-center text-sm text-slate-600 dark:text-slate-400">or</p>

            <Button
              onClick={onUploadAnother}
              variant="outline"
              className="w-full py-6"
            >
              Upload another statement
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
