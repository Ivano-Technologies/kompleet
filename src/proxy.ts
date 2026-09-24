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
 */

import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { addCorsHeaders } from "@/lib/cors";
import { CONVEX_AUTH_API_ROUTE } from "@/lib/auth/convex-auth-api-route";

const handleAuthProxy = convexAuthNextjsMiddleware(async (request) => {
  const origin = request.headers.get("origin") || "";

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    addCorsHeaders(response, origin);
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  const response = NextResponse.next({ request });
  addCorsHeaders(response, origin);
  return response;
}, {
  apiRoute: CONVEX_AUTH_API_ROUTE,
});

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  return handleAuthProxy(request, event);
}

export const config = {
  // Official @convex-dev/auth matcher: include `/api` explicitly.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
