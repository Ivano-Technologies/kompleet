// TODO(IVA-64 Phase 5): filing_deadlines is not in Convex schema. Do not invent tables.
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";

async function handleGET(request: NextRequest) {
  try {
    await requireAuthedConvex(request);
    return NextResponse.json({
      success: true,
      deadlines: [],
      count: 0,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    return NextResponse.json({ ...apiErrorBody("Internal server error") },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
