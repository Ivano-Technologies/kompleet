import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handlePATCH(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = (await request.json()) as { fullName?: string };
    const profile = await convex.mutation(api.users.updateMine, {
      fullName: body.fullName,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("profile update:", error);
    return NextResponse.json({ ...apiErrorBody("Failed to update profile") },
      { status: 500 },
    );
  }
}

export const PATCH = withRateLimit(handlePATCH, { limit: 30, window: 60_000 });
