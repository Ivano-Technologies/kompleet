'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface YearContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  isLoading: boolean;
}

const YearContext = createContext<YearContextType | undefined>(undefined);

interface YearProviderProps {
  children: ReactNode;
}

export function YearProvider({ children }: YearProviderProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYearState] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load selected year from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('kompleet_selected_year');
    if (stored) {
      const year = parseInt(stored, 10);
      if (!isNaN(year)) {
        setSelectedYearState(year);
      }
    }
  }, []);

  // Fetch available years from API
  useEffect(() => {
    async function fetchAvailableYears() {
      try {
        const response = await fetch('/api/year/available');
        if (response.ok) {
          const data = await response.json();
          setAvailableYears(data.years || [currentYear]);
        } else {
          // Fallback to default years
          setAvailableYears([currentYear - 2, currentYear - 1, currentYear]);
        }
      } catch (error) {
        console.error('Failed to fetch available years:', error);
        // Fallback to default years
        setAvailableYears([currentYear - 2, currentYear - 1, currentYear]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAvailableYears();
  }, [currentYear]);

  // Persist selected year to localStorage and log audit trail
  const setSelectedYear = async (year: number) => {
    setSelectedYearState(year);
    localStorage.setItem('kompleet_selected_year', year.toString());

    // Log year switch for audit
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'year_switch',
          resource_type: 'tax_year',
          tax_year: year,
          metadata: { previous_year: selectedYear }
        })
      });
    } catch (error) {
      console.error('Failed to log year switch:', error);
    }
  };

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear, availableYears, isLoading }}>
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error('useYear must be used within a YearProvider');
  }
  return context;
}
