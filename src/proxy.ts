/**
 * Next.js 16 Proxy — must live in `src/` next to `src/app`.
 *
 * Root `middleware.ts` is not compiled for this repo (`src/app` layout).
 * That was why staging `POST /api/auth` fell through to the Next HTML
 * document. This file plus `src/app/api/auth/route.ts` both proxy the
 * exact `/api/auth` path via `@convex-dev/auth`.
 *
 * 1. Convex Auth session cookies (refresh + exact `/api/auth` actions)
 * 2. CORS headers for mobile app cross-origin requests (not `/api/auth`)
 *
 * `convexAuthNextjsMiddleware` proxies POST `/api/auth` *before* this
 * handler runs. Do not add a catch-all under `/api/auth`.
 *
 * The library also exchanges any `?code=` itself. When that exchange fails
 * it redirects to the same URL without the code, so we send that one case
 * to `/login?error=expired_link` (see `failed-code-exchange.ts`).
 */

import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { addCorsHeaders } from "@/lib/cors";
import { CONVEX_AUTH_API_ROUTE } from "@/lib/auth/convex-auth-api-route";
import { redirectFailedCodeExchange } from "@/lib/auth/failed-code-exchange";
import {
  applySecurityHeaders,
  attachCspRequestHeaders,
  createNonce,
} from "@/lib/security-headers.mjs";

function isDevEnv(): boolean {
  return process.env.NODE_ENV === "development";
}

function applyPageSecurity(
  response: Response,
  nonce: string,
): void {
  applySecurityHeaders(response, { nonce, isDev: isDevEnv() });
}

const handleAuthProxy = convexAuthNextjsMiddleware(async (request) => {
  const origin = request.headers.get("origin") || "";
  // Same nonce the outer proxy stamped on this request — never mint a second
  // one here, or Next.js would stamp scripts with a value the response CSP
  // (applied after Convex Auth returns) would not allow.
  const nonce = request.headers.get("x-nonce") ?? createNonce();
  const requestHeaders = new Headers(request.headers);
  attachCspRequestHeaders(requestHeaders, { nonce, isDev: isDevEnv() });

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    addCorsHeaders(response, origin);
    response.headers.set("Access-Control-Max-Age", "86400");
    applyPageSecurity(response, nonce);
    return response;
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  addCorsHeaders(response, origin);
  applyPageSecurity(response, nonce);
  return response;
}, {
  apiRoute: CONVEX_AUTH_API_ROUTE,
});

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  attachCspRequestHeaders(requestHeaders, { nonce, isDev: isDevEnv() });
  const requestWithCsp = new NextRequest(request, { headers: requestHeaders });

  const response = await handleAuthProxy(requestWithCsp, event);
  if (response) {
    applyPageSecurity(response, nonce);
  }
  return redirectFailedCodeExchange(request, response);
}

export const config = {
  // Official @convex-dev/auth matcher: include `/api` explicitly.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
