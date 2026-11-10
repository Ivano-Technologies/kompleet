"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-boot";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  /** The resolved theme actually applied to the DOM ("light" or "dark") */
  resolvedTheme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemPreference();
  return theme;
}

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle(
    "dark",
    resolveTheme(theme) === "dark",
  );
}

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readStoredTheme();
    setThemeState(initial);
    applyThemeClass(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        applyThemeClass("system");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mounted, theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyThemeClass(newTheme);
  };

  const resolved = resolveTheme(theme);

  const toggleTheme = () => {
    setTheme(resolved === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme: resolved, toggleTheme, setTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

const defaultThemeContext: ThemeContextType = {
  theme: "system",
  resolvedTheme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return defaultThemeContext;
  }
  return context;
}
