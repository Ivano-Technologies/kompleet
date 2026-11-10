import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ThemeShotStamp } from "./ThemeShotStamp";

/**
 * Localhost-only mocked DashboardShell harness for theme evidence shots.
 * Production builds 404 so this never ships.
 */
export default function ThemeShotsLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      {children}
      <ThemeShotStamp />
    </Suspense>
  );
}
