import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";

/**
 * Bootstrap the Convex users row after Supabase Auth login/signup.
 * Idempotent. Does not write to Supabase profiles.
 */
export async function POST(request: NextRequest) {
  try {
    const { convex, user } = await requireAuthedConvex(request);
    const fullName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : undefined;
    const profile = await convex.mutation(api.users.ensureCurrent, {
      email: user.email ?? undefined,
      fullName,
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
