'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check localStorage first
    const storedTheme = localStorage.getItem('kompleet-theme') as Theme | null;
    
    if (storedTheme) {
      setThemeState(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      // Detect system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = systemPrefersDark ? 'dark' : 'light';
      setThemeState(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('kompleet-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Safe defaults for SSR/pre-rendering — does NOT throw when used outside ThemeProvider
const defaultThemeContext: ThemeContextType = {
  theme: 'light',
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
