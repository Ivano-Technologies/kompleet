/**
 * Next.js Middleware
 *
 * 1. Refreshes Supabase auth session on every request (keeps cookies fresh)
 * 2. Adds CORS headers for mobile app cross-origin requests
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addCorsHeaders } from "@/lib/cors";

export async function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") || "";

  // Handle preflight OPTIONS — no need to refresh session
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    addCorsHeaders(response, origin);
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
  }

  // Create a response that we'll pass through the Supabase session refresh
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Set cookies on the request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Recreate the response with the updated request
          supabaseResponse = NextResponse.next({ request });
          // Set cookies on the response (for the browser)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session — this reads the auth cookie, refreshes if expired,
  // and writes updated tokens back via setAll above.
  // IMPORTANT: Do NOT use getSession() here — getUser() validates the token
  // server-side and is the secure way to refresh.
  await supabase.auth.getUser();

  // Add CORS headers
  addCorsHeaders(supabaseResponse, origin);

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all routes except static assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
