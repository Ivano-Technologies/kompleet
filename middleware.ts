/**
 * Next.js Middleware
 *
 * 1. Convex Auth session cookies (refresh + /api/auth actions)
 * 2. CORS headers for mobile app cross-origin requests
 */

import {
  convexAuthNextjsMiddleware,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";
import { addCorsHeaders } from "@/lib/cors";

export default convexAuthNextjsMiddleware(async (request) => {
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
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
