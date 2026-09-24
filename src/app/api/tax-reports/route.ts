import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { omitUndefined } from "@/lib/convex/args";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const searchParams = request.nextUrl.searchParams;
    const taxYearRaw = searchParams.get("taxYear");
    const taxYear = taxYearRaw ? parseInt(taxYearRaw, 10) : undefined;
    const status = searchParams.get("status") ?? undefined;
    const reportType = searchParams.get("reportType") ?? undefined;

    const reports = await convex.query(
      api.tax.listReports,
      omitUndefined({
        taxYear:
          taxYear !== undefined && Number.isFinite(taxYear) ? taxYear : undefined,
        status,
        reportType,
      }),
    );

    return NextResponse.json({
      reports: Array.isArray(reports) ? reports : [],
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in GET /api/tax-reports:", error);
    // Authenticated empty/missing year-tax data must not 500 the page.
    return NextResponse.json({ reports: [] });
  }
}

export const GET = withRateLimit(handleGET);
