import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const year = Number((body as { year?: number }).year);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ ...apiErrorBody("Invalid year") }, { status: 400 });
    }
    const result = await convex.mutation(api.year.switchYear, { taxYear: year });
    return NextResponse.json(result);
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("Error in /api/year/switch:", error);
    return NextResponse.json({ ...apiErrorBody("Failed to switch year") },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 20 });
