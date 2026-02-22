"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, AlertCircle, CheckCircle, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FeedbackStats {
  totalFeedback: number;
  correctPredictions: number;
  incorrectPredictions: number;
  overallAccuracy: number;
  lastFeedbackDate?: Date;
}

interface CategoryAccuracy {
  category: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  commonMisclassifications: Array<{
    predictedAs: string;
    actualCategory: string;
    count: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [categoryAccuracy, setCategoryAccuracy] = useState<CategoryAccuracy[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch statistics
        const statsRes = await fetch("/api/feedback?type=statistics");
        if (!statsRes.ok) throw new Error("Failed to fetch statistics");
        const statsData = await statsRes.json();
        setStats(statsData.data);

        // Fetch category accuracy
        const accuracyRes = await fetch("/api/feedback?type=accuracy");
        if (!accuracyRes.ok) throw new Error("Failed to fetch accuracy");
        const accuracyData = await accuracyRes.json();
        setCategoryAccuracy(accuracyData.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20 p-6">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-red-900 dark:text-red-200">{error}</p>
        </div>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Feedback */}
        <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Total Corrections
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.totalFeedback}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-20" />
          </div>
        </Card>

        {/* Correct Predictions */}
        <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Correct
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.correctPredictions}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 opacity-20" />
          </div>
        </Card>

        {/* Incorrect Predictions */}
        <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Incorrect
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.incorrectPredictions}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 opacity-20" />
          </div>
        </Card>

        {/* Overall Accuracy */}
        <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                Accuracy
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {(stats.overallAccuracy * 100).toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-slate-600 dark:text-slate-400 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Category Accuracy Table */}
      {categoryAccuracy.length > 0 && (
        <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Category Performance
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-2 text-slate-600 dark:text-slate-400 font-medium">
                    Category
                  </th>
                  <th className="text-center py-2 px-2 text-slate-600 dark:text-slate-400 font-medium">
                    Predictions
                  </th>
                  <th className="text-center py-2 px-2 text-slate-600 dark:text-slate-400 font-medium">
                    Correct
                  </th>
                  <th className="text-center py-2 px-2 text-slate-600 dark:text-slate-400 font-medium">
                    Accuracy
                  </th>
                </tr>
              </thead>
              <tbody>
                {categoryAccuracy.map((cat) => (
                  <tr
                    key={cat.category}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-3 px-2 text-slate-900 dark:text-white font-medium">
                      {cat.category}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-600 dark:text-slate-400">
                      {cat.totalPredictions}
                    </td>
                    <td className="py-3 px-2 text-center text-green-600 dark:text-green-400 font-medium">
                      {cat.correctPredictions}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          cat.accuracy >= 0.8
                            ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                            : cat.accuracy >= 0.6
                              ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                              : "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {(cat.accuracy * 100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Last feedback date */}
      {stats.lastFeedbackDate && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Last correction:{" "}
          {new Date(stats.lastFeedbackDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
