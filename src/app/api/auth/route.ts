/**
 * Exact POST /api/auth handler for Convex Auth (signIn / signOut).
 *
 * `@convex-dev/auth` Next.js normally proxies this from middleware. A root
 * `middleware.ts` is not compiled when the app lives in `src/app`, so staging
 * POST `/api/auth` fell through to the Kompleet HTML document (200 text/html)
 * and `@convex-dev/auth/nextjs` failed at `response.json()`. This route is the
 * App Router guarantee that the path cannot render a page.
 *
 * Matches ONLY `/api/auth`. Subroutes (`ensure-profile`, `login`, …) keep their
 * own `route.ts` files — do not replace this with a catch-all.
 *
 * Error mapping: production Convex redacts thrown messages, so this handler
 * reads `ConvexError.data` (see `convex-auth-proxy.ts`) rather than using the
 * library proxy's `{ error: error.message }`.
 */

import { handleConvexAuthProxy } from "@/lib/auth/convex-auth-proxy";
import { sanitizeAuthProxyResponse } from "@/lib/auth/sanitize-proxy-error";
import { withRateLimit } from "@/lib/with-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleAuth(request: Request): Promise<Response> {
  return sanitizeAuthProxyResponse(await handleConvexAuthProxy(request));
}

export const POST = withRateLimit(handleAuth, {
  limit: 30,
  window: 60_000,
});

export const GET = withRateLimit(handleAuth, {
  limit: 60,
  window: 60_000,
});
