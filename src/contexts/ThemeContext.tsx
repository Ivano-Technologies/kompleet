"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DARK_MODE_ENABLED, THEME_STORAGE_KEY } from "@/lib/theme-boot";

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
  if (!DARK_MODE_ENABLED) return "light";
  if (theme === "system") return getSystemPreference();
  return theme;
}

function applyThemeClass(theme: Theme) {
  const dark = DARK_MODE_ENABLED && resolveTheme(theme) === "dark";
  document.documentElement.classList.toggle("dark", dark);
}

function readStoredTheme(): Theme {
  if (!DARK_MODE_ENABLED) return "light";
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    DARK_MODE_ENABLED ? "system" : "light",
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!DARK_MODE_ENABLED) {
      localStorage.removeItem(THEME_STORAGE_KEY);
      document.documentElement.classList.remove("dark");
      setThemeState("light");
      setMounted(true);
      return;
    }
    const initial = readStoredTheme();
    setThemeState(initial);
    applyThemeClass(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!DARK_MODE_ENABLED || !mounted) return;
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
    if (!DARK_MODE_ENABLED) {
      setThemeState("light");
      localStorage.removeItem(THEME_STORAGE_KEY);
      document.documentElement.classList.remove("dark");
      return;
    }
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
  theme: DARK_MODE_ENABLED ? "system" : "light",
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
