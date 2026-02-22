"use client";

import React from "react";
import { useYear } from "@/contexts/year-context";

export function YearSelector() {
  const { selectedYear, setSelectedYear, availableYears, isLoading } =
    useYear();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-light-border dark:border-dark-border border-t-green-600"></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="year-selector"
        className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary"
      >
        Tax Year:
      </label>
      <select
        id="year-selector"
        value={selectedYear}
        onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
        className="rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-3 py-2 text-sm font-medium text-light-text-primary dark:text-dark-text-primary hover:bg-light-background dark:bg-dark-background focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}

// Compact version for mobile/header
export function YearSelectorCompact() {
  const { selectedYear, setSelectedYear, availableYears, isLoading } =
    useYear();

  if (isLoading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-md bg-light-border dark:bg-dark-border"></div>
    );
  }

  return (
    <select
      value={selectedYear}
      onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
      className="rounded-md border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-2 py-1 text-sm font-medium text-light-text-primary dark:text-dark-text-primary hover:bg-light-background dark:bg-dark-background focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      aria-label="Select tax year"
    >
      {availableYears.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
}
