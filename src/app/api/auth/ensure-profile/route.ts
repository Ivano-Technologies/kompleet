import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";

/**
 * Bootstrap / refresh the Convex users row after Convex Auth login/signup.
 * Idempotent. Remaps existing profiles by email.
 */
export async function POST(request: NextRequest) {
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
    return NextResponse.json({ profile });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("ensure-profile:", error);
    return NextResponse.json(
      { error: "Failed to ensure profile" },
      { status: 500 },
    );
  }
}
