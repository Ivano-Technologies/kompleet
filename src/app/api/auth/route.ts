/**
 * Exact POST /api/auth handler for Convex Auth (signIn / signOut).
 *
 * `@convex-dev/auth` Next.js normally proxies this from
 * `convexAuthNextjsMiddleware` in `src/proxy.ts`. A root `middleware.ts` is
 * not compiled when the app lives in `src/app`, so staging POST `/api/auth`
 * fell through to the Kompleet HTML document (200 text/html) and
 * `@convex-dev/auth/nextjs` failed at `response.json()`. This route is the
 * App Router guarantee that the path cannot render a page.
 *
 * Matches ONLY `/api/auth`. Subroutes (`ensure-profile`, `login`, …) keep their
 * own `route.ts` files — do not replace this with a catch-all.
 */

import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextFetchEvent, NextRequest } from "next/server";
import {
  CONVEX_AUTH_API_ROUTE,
  isExactConvexAuthProxyPath,
} from "@/lib/auth/convex-auth-api-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const proxyAuth = convexAuthNextjsMiddleware(undefined, {
  apiRoute: CONVEX_AUTH_API_ROUTE,
});

async function handleConvexAuthProxy(request: NextRequest): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (!isExactConvexAuthProxyPath(pathname)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const result = await proxyAuth(request, {} as NextFetchEvent);
  if (result) {
    return result;
  }

  return Response.json(
    { error: "Convex Auth proxy did not handle this request" },
    { status: 500 },
  );
}

export function POST(request: NextRequest): Promise<Response> {
  return handleConvexAuthProxy(request);
}

export function GET(request: NextRequest): Promise<Response> {
  return handleConvexAuthProxy(request);
}
