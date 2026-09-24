import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const searchParams = request.nextUrl.searchParams;
    const forms = await convex.query(api.forms.listMine, {
      formType: searchParams.get("formType") ?? undefined,
      taxYear: searchParams.get("taxYear")
        ? parseInt(searchParams.get("taxYear")!, 10)
        : undefined,
      status: searchParams.get("status") ?? undefined,
    });

    return NextResponse.json({
      success: true,
      forms,
      count: forms.length,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("List forms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
