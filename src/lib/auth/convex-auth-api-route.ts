/**
 * Exact Convex Auth Next.js proxy path (`@convex-dev/auth` default `apiRoute`).
 *
 * Must stay exact: `/api/auth/ensure-profile`, `/login`, etc. are App Router
 * handlers and must not be swallowed by a catch-all.
 */
export const CONVEX_AUTH_API_ROUTE = "/api/auth";

export function isExactConvexAuthProxyPath(pathname: string): boolean {
  return (
    pathname === CONVEX_AUTH_API_ROUTE ||
    pathname === `${CONVEX_AUTH_API_ROUTE}/`
  );
}
