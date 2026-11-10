import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { isThemeShotsBlocked } from "@/lib/theme-shots-gate";
import { ThemeShotStamp } from "./ThemeShotStamp";

/**
 * Localhost-only mocked DashboardShell harness for theme evidence shots.
 * 404 when NODE_ENV or VERCEL_ENV is production so this never ships.
 */
export default function ThemeShotsLayout({ children }: { children: ReactNode }) {
  if (isThemeShotsBlocked()) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      {children}
      <ThemeShotStamp />
    </Suspense>
  );
}
