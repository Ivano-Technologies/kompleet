import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

export const runtime = "nodejs";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const searchParams = request.nextUrl.searchParams;
    const taxYear = searchParams.get("taxYear");
    const status = searchParams.get("status");
    const reportType = searchParams.get("reportType");

    const reports = await convex.query(api.tax.listReports, {
      taxYear: taxYear ? parseInt(taxYear, 10) : undefined,
      status: status ?? undefined,
      reportType: reportType ?? undefined,
    });

    return NextResponse.json({ reports });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in GET /api/tax-reports:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
