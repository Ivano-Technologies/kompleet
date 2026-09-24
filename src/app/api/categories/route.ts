import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";

export const runtime = "nodejs";

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { convex } = await requireAuthedConvex(request);
    const categories = await convex.query(api.categories.list, {});
    return NextResponse.json({ categories });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET, { limit: 120 });
