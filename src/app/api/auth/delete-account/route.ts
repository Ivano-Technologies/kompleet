/**
 * Delete Account API
 * POST /api/auth/delete-account
 *
 * Soft-deletes the Convex profile. Does not pause or delete the Supabase project.
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { z } from "zod";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";

const deleteAccountSchema = z.object({
  confirmText: z.literal("DELETE", {
    error: "You must type DELETE to confirm",
  }),
});

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const body = await request.json();
    const parsed = deleteAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await convex.mutation(api.users.softDeleteMine, {});

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Delete Account Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 3, window: 3600000 });
