/**
 * Legacy Supabase Auth callback. Convex Auth handles sessions via
 * `/api/auth` and middleware cookies. Keep this route so old email
 * links do not 404.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const redirect = new URL("/login", request.url);
  redirect.searchParams.set(
    "message",
    "Sign in with email and password. Password reset now uses a code from /forgot-password.",
  );
  return NextResponse.redirect(redirect);
}
