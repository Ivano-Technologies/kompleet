/**
 * Tax Sources API
 * GET /api/tax/sources - Get all regulatory sources
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { api } from "@/lib/convex/http";
import { requireAuthedConvex } from "@/lib/convex/server";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const sources = await convex.query(api.tax.listSources, {});
    return NextResponse.json({ sources });
  } catch (error) {
    console.error("Error in GET /api/tax/sources:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(handleGET, {
  requiredPermission: "admin:manage_rules",
});
