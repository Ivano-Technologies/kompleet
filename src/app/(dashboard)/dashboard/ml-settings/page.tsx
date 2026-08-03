"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  RefreshCw,
  TrendingUp,
  CheckCircle,
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

export default function MLSettingsPage() {
  // NOTE: email ingestion is postponed — see docs/DEFERRED_FEATURES.md.
  // This previously hard-coded a connected Gmail account with a real
  // third-party address, so the UI reported a connection that never existed.
  // Defaults to disconnected until the feature ships and this reads real state.
  const [emailConnections, setEmailConnections] = useState({
    gmail: { connected: false, email: "" },
    outlook: { connected: false, email: "" },
  });
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
      console.error("Error loading ML settings:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function connectEmail(provider: "gmail" | "outlook") {
    try {
      const res = await fetch(`/api/email/connect/${provider}`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.authorization_url;
      }
    } catch (error) {
      console.error(`Error connecting ${provider}:`, error);
    }
  }

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
            ML & Automation Settings
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Manage email integrations, view ML performance, and configure
            automation.
          </p>
        </div>
      </div>

      {/* Email Connections */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
          <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
            Email Integrations
          </h2>
        </div>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">
          Connect your email accounts to automatically import transactions from
          receipts.
        </p>
        <div className="space-y-4">
          {/* Gmail */}
          <div className="flex items-center justify-between p-4 border border-light-border dark:border-dark-border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                  Gmail
                </p>
                {emailConnections.gmail.connected ? (
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {emailConnections.gmail.email}
                  </p>
                ) : (
                  <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                    Not connected
                  </p>
                )}
              </div>
            </div>
            {emailConnections.gmail.connected ? (
              <Badge
                variant="outline"
                className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900"
              >
                <CheckCircle className="w-3 h-3 mr-1.5" />
                Connected
              </Badge>
            ) : (
              <Button
                onClick={() => connectEmail("gmail")}
                className="btn-secondary"
              >
                Connect
              </Button>
            )}
          </div>

          {/* Outlook */}
          <div className="flex items-center justify-between p-4 border border-light-border dark:border-dark-border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                  Outlook
                </p>
                {emailConnections.outlook.connected ? (
                  <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    {emailConnections.outlook.email}
                  </p>
                ) : (
                  <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                    Not connected
                  </p>
                )}
              </div>
            </div>
            {emailConnections.outlook.connected ? (
              <Badge
                variant="outline"
                className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900"
              >
                <CheckCircle className="w-3 h-3 mr-1.5" />
                Connected
              </Badge>
            ) : (
              <Button
                onClick={() => connectEmail("outlook")}
                className="btn-secondary"
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ML Performance */}
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
            <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Categorization Performance
            </h2>
          </div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-6">
            Your corrections help improve the ML model for all users.
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
                    Model Accuracy
                  </p>
                  <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    87%
                  </p>
                </div>
              </div>

              {correctionStats.topMiscategorized.length > 0 && (
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

        {/* Recurring Transactions */}
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
