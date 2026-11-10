import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";

/**
 * Bootstrap / refresh the Convex users row after Convex Auth login/signup.
 * Idempotent. Remaps existing profiles by email.
 */
async function handlePOST(request: NextRequest) {
  try {
    const { convex, user } = await requireAuthedConvex(request);
    let body: { email?: string; fullName?: string } = {};
    try {
      body = (await request.json()) as { email?: string; fullName?: string };
    } catch {
      body = {};
    }
    const profile = await convex.mutation(api.users.ensureCurrent, {
      email: body.email ?? user.email ?? undefined,
      fullName:
        body.fullName ??
        (typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : undefined),
    });
    const userAgent = request.headers.get("user-agent") ?? "";
    await convex
      .action(api.sessions.recordSignIn, { userAgent })
      .catch(() => {});
    return NextResponse.json({ profile });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("ensure-profile:", error);
    return NextResponse.json({ ...apiErrorBody("Failed to ensure profile") },
      { status: 500 },
    );
  }
}

// Auth-required bootstrap: login, signup, verify-email, AuthContext, and
// the e2e helper all POST this on a session. 20/min 429s a normal dashboard
// tour and CI (one worker, many logins in the same window).
export const POST = withRateLimit(handlePOST, { limit: 120, window: 60_000 });
