"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemPreference();
  return theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const storedTheme = localStorage.getItem("kompleet-theme") as Theme | null;
    const initial: Theme =
      storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
        ? storedTheme
        : "system";
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", resolveTheme(initial) === "dark");
  }, [mounted]);

  // Listen for OS-level preference changes when theme is "system"
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        document.documentElement.classList.toggle("dark", mq.matches);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mounted, theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("kompleet-theme", newTheme);
    document.documentElement.classList.toggle(
      "dark",
      resolveTheme(newTheme) === "dark"
    );
  };

  const toggleTheme = () => {
    const next: Theme =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  const resolved = resolveTheme(theme);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: resolved, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Safe defaults for SSR/pre-rendering — does NOT throw when used outside ThemeProvider
const defaultThemeContext: ThemeContextType = {
  theme: "system",
  resolvedTheme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
};

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  // Return safe defaults during SSR/pre-rendering instead of throwing
  if (context === undefined) {
    return defaultThemeContext;
  }
  return context;
}
