'use client';

import React from 'react';
import { useYear } from '@/contexts/year-context';

export function YearSelector() {
  const { selectedYear, setSelectedYear, availableYears, isLoading } = useYear();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600"></div>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="year-selector" className="text-sm font-medium text-gray-700">
        Tax Year:
      </label>
      <select
        id="year-selector"
        value={selectedYear}
        onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
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
  const { selectedYear, setSelectedYear, availableYears, isLoading } = useYear();

  if (isLoading) {
    return (
      <div className="h-8 w-20 animate-pulse rounded-md bg-gray-200"></div>
    );
  }

  return (
    <select
      value={selectedYear}
      onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
