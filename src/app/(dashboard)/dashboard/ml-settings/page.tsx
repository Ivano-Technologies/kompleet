"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  TrendingUp,
  Loader2,
  BrainCircuit,
} from "lucide-react";

interface CorrectionStats {
  totalCorrections: number;
  correctionRate: number;
  topMiscategorized: Array<{ pair: string; count: number }>;
}

interface RecurringPattern {
  merchant_normalized: string;
  interval_days: number;
  amount_mean: number;
  confidence: number;
  next_expected_date: string;
  occurrence_count: number;
}

/**
 * Categorization & automation settings.
 * Email ingestion postponed — see docs/DEFERRED_FEATURES.md.
 */
export default function MLSettingsPage() {
  const [correctionStats, setCorrectionStats] =
    useState<CorrectionStats | null>(null);
  const [recurringPatterns, setRecurringPatterns] = useState<
    RecurringPattern[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, patternsRes] = await Promise.all([
        fetch("/api/ml/corrections"),
        fetch("/api/ml/recurring"),
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setCorrectionStats(stats);
      }

      if (patternsRes.ok) {
        const data = await patternsRes.json();
        setRecurringPatterns(data.patterns || []);
      }
    } catch (error) {
      console.error("Error loading automation settings:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function detectRecurringPatterns() {
    setIsDetecting(true);
    try {
      const res = await fetch("/api/ml/recurring", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setRecurringPatterns(data.patterns || []);
      }
    } catch (error) {
      console.error("Error detecting patterns:", error);
    } finally {
      setIsDetecting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border rounded-lg">
          <BrainCircuit className="w-6 h-6 text-light-text-primary dark:text-dark-text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Categorization & Automation
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Review correction feedback and recurring payment patterns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
            <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Categorization Performance
            </h2>
          </div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">
            Your corrections improve future suggestions for your firm.
          </p>
          {correctionStats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-light-background dark:bg-dark-background rounded-lg">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    Total Corrections
                  </p>
                  <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    {correctionStats.totalCorrections}
                  </p>
                </div>
                <div className="p-4 bg-light-background dark:bg-dark-background rounded-lg">
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    Agreement rate
                  </p>
                  <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    {Math.round((correctionStats.correctionRate || 0) * 100)}%
                  </p>
                </div>
              </div>

              {correctionStats.topMiscategorized?.length > 0 && (
                <div>
                  <p className="font-medium text-light-text-primary dark:text-dark-text-primary mb-3">
                    Most Common Corrections
                  </p>
                  <div className="space-y-2">
                    {correctionStats.topMiscategorized
                      .slice(0, 3)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm p-3 bg-light-background dark:bg-dark-background rounded-lg"
                        >
                          <span className="text-light-text-secondary dark:text-dark-text-secondary font-mono text-xs">
                            {item.pair}
                          </span>
                          <Badge variant="secondary" className="font-normal">
                            {item.count} times
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-light-text-tertiary dark:text-dark-text-tertiary">
                No performance data available.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
              <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                Recurring Transactions
              </h2>
            </div>
            <Button
              onClick={detectRecurringPatterns}
              disabled={isDetecting}
              className="btn-secondary"
            >
              {isDetecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Detect
            </Button>
          </div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">
            Automatically detected payment patterns from your transaction
            history.
          </p>

          <div className="space-y-4">
            {recurringPatterns.length > 0 ? (
              <div className="space-y-3">
                {recurringPatterns.slice(0, 3).map((pattern, idx) => (
                  <div
                    key={idx}
                    className="p-3 border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium capitalize text-light-text-primary dark:text-dark-text-primary">
                          {pattern.merchant_normalized.replace(
                            /([a-z])([A-Z])/g,
                            "$1 $2",
                          )}
                        </p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
                          ~&#x20A6;{pattern.amount_mean.toLocaleString()} every{" "}
                          {pattern.interval_days} days
                        </p>
                      </div>
                      <Badge variant="outline" className="font-normal text-xs">
                        {Math.round(pattern.confidence * 100)}% sure
                      </Badge>
                    </div>
                    <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-2">
                      Next expected:{" "}
                      {new Date(pattern.next_expected_date).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-light-border dark:border-dark-border rounded-lg">
                <p className="text-light-text-tertiary dark:text-dark-text-tertiary text-sm">
                  No recurring patterns found yet.
                </p>
                <p className="text-light-text-tertiary dark:text-dark-text-tertiary text-xs mt-1">
                  Click &quot;Detect&quot; to analyze your transactions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
