"use client";

import { useState, useEffect } from "react";
import { BarChart, FileText, Loader2, ArrowUp, ArrowDown } from "lucide-react";

// Mock data - replace with actual data fetching
const mockData = {
  currentYear: {
    revenue: 120000,
    profit: 45000,
    expenses: 75000,
  },
  previousYear: {
    revenue: 100000,
    profit: 38000,
    expenses: 62000,
  },
};

const YoYEvaluationPage = () => {
  const [data, setData] = useState<typeof mockData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 1500);
  }, []);

  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return "N/A";
    return (((current - previous) / previous) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6">
      <header className="flex items-center gap-3 mb-8">
        <div className="bg-primary-500/10 p-2 rounded-lg">
          <BarChart className="h-6 w-6 text-primary-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Year-over-Year Comparison
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Analyze your financial performance against the previous year.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
            Revenue
          </h2>
          <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            ${data.currentYear.revenue.toLocaleString()}
          </p>
          <div className="flex items-center mt-2">
            <span
              className={`flex items-center text-sm font-medium ${
                data.currentYear.revenue > data.previousYear.revenue
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {data.currentYear.revenue > data.previousYear.revenue ? (
                <ArrowUp className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-1" />
              )}
              {calculatePercentageChange(
                data.currentYear.revenue,
                data.previousYear.revenue
              )}%
            </span>
            <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary ml-2">
              vs ${data.previousYear.revenue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Profit Card */}
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
            Profit
          </h2>
          <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            ${data.currentYear.profit.toLocaleString()}
          </p>
          <div className="flex items-center mt-2">
            <span
              className={`flex items-center text-sm font-medium ${
                data.currentYear.profit > data.previousYear.profit
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {data.currentYear.profit > data.previousYear.profit ? (
                <ArrowUp className="h-4 w-4 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-1" />
              )}
              {calculatePercentageChange(
                data.currentYear.profit,
                data.previousYear.profit
              )}%
            </span>
            <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary ml-2">
              vs ${data.previousYear.profit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
            Expenses
          </h2>
          <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            ${data.currentYear.expenses.toLocaleString()}
          </p>
          <div className="flex items-center mt-2">
            <span
              className={`flex items-center text-sm font-medium ${
                data.currentYear.expenses < data.previousYear.expenses
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {data.currentYear.expenses < data.previousYear.expenses ? (
                <ArrowDown className="h-4 w-4 mr-1" />
              ) : (
                <ArrowUp className="h-4 w-4 mr-1" />
              )}
              {calculatePercentageChange(
                data.currentYear.expenses,
                data.previousYear.expenses
              )}%
            </span>
            <span className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary ml-2">
              vs ${data.previousYear.expenses.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Detailed Report</h3>
        <button className="btn-primary rounded-lg inline-flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Download Full Report
        </button>
      </div>
    </div>
  );
};

export default YoYEvaluationPage;
