/**
 * Check regulatory sources for updates
 * POST /api/tax/sources/check — bumps Convex sources.updatedAt
 * (last_checked_at is not in the Convex schema).
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { api } from "@/lib/convex/http";
import { requireAuthedConvex } from "@/lib/convex/server";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json().catch(() => ({}));
    const sourceId = (body as { sourceId?: string }).sourceId;
    const result = await convex.mutation(api.tax.touchSources, {
      sourceExternalId: sourceId,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/tax/sources/check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(handlePOST, {
  requiredPermission: "admin:manage_rules",
});
