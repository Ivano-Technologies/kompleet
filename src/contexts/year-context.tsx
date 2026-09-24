"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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

function defaultYears(currentYear: number): number[] {
  return [currentYear - 2, currentYear - 1, currentYear];
}

export function YearProvider({ children }: YearProviderProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYearState] = useState<number>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("kompleet_selected_year");
    if (stored) {
      const year = parseInt(stored, 10);
      if (!Number.isNaN(year)) {
        setSelectedYearState(year);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadYears() {
      try {
        const response = await fetch("/api/year/available");
        if (cancelled) return;
        if (response.ok) {
          const data = await response.json();
          setAvailableYears(data.years || defaultYears(currentYear));
        } else {
          setAvailableYears(defaultYears(currentYear));
        }
      } catch (error) {
        console.error("Failed to fetch available years:", error);
        if (!cancelled) {
          setAvailableYears(defaultYears(currentYear));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadYears();
    return () => {
      cancelled = true;
    };
  }, [currentYear]);

  const setSelectedYear = (year: number) => {
    setSelectedYearState(year);
    localStorage.setItem("kompleet_selected_year", String(year));
  };

  return (
    <YearContext.Provider
      value={{ selectedYear, setSelectedYear, availableYears, isLoading }}
    >
      {children}
    </YearContext.Provider>
  );
}

export function useYear(): YearContextType {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error("useYear must be used within a YearProvider");
  }
  return context;
}
