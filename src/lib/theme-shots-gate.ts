/**
 * Theme-shot harness must never be reachable in production.
 * NODE_ENV=production covers Vercel preview and production builds.
 * VERCEL_ENV=production is the explicit production deploy check.
 */
export function isThemeShotsBlocked(
  env: { NODE_ENV?: string; VERCEL_ENV?: string } = process.env,
): boolean {
  return env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
}
