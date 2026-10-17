/**
 * Canonical production origin for SEO surfaces (canonical links, sitemap,
 * robots, JSON-LD). Deliberately not NEXT_PUBLIC_SITE_URL: previews must still
 * point canonicals at the production host.
 */
export const CANONICAL_ORIGIN = "https://kompleet.techivano.com";

/** Public marketing pages that exist under src/app (home + src/app/(public)). */
export const PUBLIC_MARKETING_PATHS = [
  "/",
  "/pricing",
  "/about",
  "/contact",
  "/help",
  "/careers",
  "/press",
  "/api-docs",
  "/privacy",
  "/terms",
  "/cookies",
] as const;

export type PublicMarketingPath = (typeof PUBLIC_MARKETING_PATHS)[number];

/**
 * App, auth, dashboard and API routes kept out of crawling. Prefixes are
 * chosen so no public page or public asset shares them (for example "/app/"
 * rather than "/app", which would also match "/apple-touch-180.png").
 */
export const PRIVATE_ROUTE_PREFIXES = [
  "/api/",
  "/app$",
  "/app/",
  "/admin",
  "/auth/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/401",
  "/403",
  "/dashboard",
  "/calculators",
  "/categories",
  "/documents",
  "/expenses",
  "/export",
  "/filing",
  "/history",
  "/invoices",
  "/ml-governance",
  "/notifications",
  "/profile",
  "/reports",
  "/settings",
  "/tax",
  "/transactions",
  "/yoy-comparison",
] as const;

export function absoluteUrl(path: string): string {
  return path === "/" ? CANONICAL_ORIGIN : `${CANONICAL_ORIGIN}${path}`;
}
