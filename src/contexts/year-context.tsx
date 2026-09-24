"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useConvexAuth } from "convex/react";
import { defaultTaxYears } from "@/lib/tax-years";

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
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
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

  // YearProvider wraps the root layout, including public pages. Fetch only
  // after Convex auth resolves so login/marketing do not spam 401s, and so
  // Export Center refetches once the same session that can hit /dashboard
  // is actually ready.
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function loadYears() {
      if (!isAuthenticated) {
        setAvailableYears(defaultTaxYears());
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/year/available", {
          credentials: "same-origin",
        });
        if (cancelled) return;
        if (response.ok) {
          const data = (await response.json()) as { years?: number[] };
          setAvailableYears(data.years || defaultTaxYears());
        } else {
          setAvailableYears(defaultTaxYears());
        }
      } catch (error) {
        console.error("Failed to fetch available years:", error);
        if (!cancelled) {
          setAvailableYears(defaultTaxYears());
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadYears();
    return () => {
      cancelled = true;
    };
  }, [currentYear, authLoading, isAuthenticated]);

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
