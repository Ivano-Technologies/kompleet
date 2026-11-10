/**
 * Check regulatory sources for updates
 * POST /api/tax/sources/check — bumps Convex sources.updatedAt
 * (last_checked_at is not in the Convex schema).
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { api } from "@/lib/convex/http";
import { isForbidden, requireAuthedConvex } from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";

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
    if (isForbidden(error)) {
      return NextResponse.json({ ...apiErrorBody("Forbidden") }, { status: 403 });
    }
    return NextResponse.json({ ...apiErrorBody("Internal server error") },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(
  withAuth(handlePOST, {
    requiredPermission: "admin:manage_rules",
  }),
  { limit: 20 },
);
