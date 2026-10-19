/**
 * Legacy Supabase Auth callback. Convex Auth handles sessions via
 * `/api/auth` and middleware cookies. Keep this route so old email
 * links do not 404.
 *
 * Old magic link, reset and confirmation links can no longer sign anyone in.
 * Expired, used or invalid links go to `/login?error=expired_link`. Any other
 * provider error goes to `/login?error=auth_failed`. Raw provider text is
 * never forwarded. Errors the provider puts in the URL hash never reach the
 * server; the browser keeps the hash across this redirect and
 * `AuthLinkErrorRedirect` handles it on the client.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { callbackLoginError } from "@/lib/auth/link-error";

export async function GET(request: NextRequest) {
  const redirect = new URL("/login", request.url);
  const kind = callbackLoginError(request.nextUrl.searchParams);
  if (kind) {
    redirect.searchParams.set("error", kind);
  }
  return NextResponse.redirect(redirect);
}
