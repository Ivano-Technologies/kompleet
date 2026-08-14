"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/client";

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

  // Load selected year from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("kompleet_selected_year");
    if (stored) {
      const year = parseInt(stored, 10);
      if (!isNaN(year)) {
        setSelectedYearState(year);
      }
    }
  }, []);

  // Fetch available years only after auth has resolved with a session.
  // YearProvider wraps the root layout, including public pages; calling
  // GET /api/year/available before that produced four 401s per navigation.
  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient();

    async function loadYears(session: Session | null) {
      if (cancelled) return;
      if (!session) {
        setAvailableYears(defaultYears(currentYear));
        setIsLoading(false);
        return;
      }

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

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void loadYears(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // getSession already handled the first paint; skip the duplicate
      // INITIAL_SESSION event so public pages do not double-resolve.
      if (event === "INITIAL_SESSION") return;
      void loadYears(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [currentYear]);

  // Persist selected year to localStorage and log audit trail
  const setSelectedYear = async (year: number) => {
    setSelectedYearState(year);
    localStorage.setItem("kompleet_selected_year", year.toString());

    // Log year switch for audit
    try {
      await fetch("/api/audit/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "year_switch",
          resource_type: "tax_year",
          tax_year: year,
          metadata: { previous_year: selectedYear },
        }),
      });
    } catch (error) {
      console.error("Failed to log year switch:", error);
    }
  };

  return (
    <YearContext.Provider
      value={{ selectedYear, setSelectedYear, availableYears, isLoading }}
    >
      {children}
    </YearContext.Provider>
  );
}

export function useYear() {
  const context = useContext(YearContext);
  if (context === undefined) {
    throw new Error("useYear must be used within a YearProvider");
  }
  return context;
}
