import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api, createConvexHttpClient } from "@/lib/convex/http";
import { omitUndefined } from "@/lib/convex/args";
import { toJsonSafe } from "@/lib/convex/json";
import { getConvexAccessToken } from "@/lib/auth/session";
import { rethrowIfNextControlFlow } from "@/lib/next-control-flow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emptyReports() {
  return NextResponse.json({ reports: [] });
}

function listArgs(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const taxYearRaw = searchParams.get("taxYear");
  const taxYear = taxYearRaw ? parseInt(taxYearRaw, 10) : undefined;
  return omitUndefined({
    taxYear:
      taxYear !== undefined && Number.isFinite(taxYear) ? taxYear : undefined,
    status: searchParams.get("status") ?? undefined,
    reportType: searchParams.get("reportType") ?? undefined,
  });
}

async function handleGET(request: NextRequest) {
  const token = await getConvexAccessToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const convex = createConvexHttpClient(token);
    const args = listArgs(request);
    let reports: unknown;
    try {
      reports = await convex.query(api.tax.listReports, args);
    } catch (error) {
      rethrowIfNextControlFlow(error);
      // Cold Convex isolate / first HTTP handshake can fail once, then succeed.
      reports = await convex.query(api.tax.listReports, args);
    }
    return NextResponse.json({
      reports: toJsonSafe(Array.isArray(reports) ? reports : [], []),
    });
  } catch (error) {
    rethrowIfNextControlFlow(error);
    console.error("Error in GET /api/tax-reports:", error);
    // Token was present — authenticated list must not 500 on transient Convex.
    return emptyReports();
  }
}

export async function GET(request: NextRequest, context?: unknown) {
  try {
    // Opt into dynamic cookies *before* any data catch-all. Swallowing this
    // on a cold isolate is the Next.js 16 500 (Path-2 first paint).
    await cookies();
    return await withRateLimit(handleGET)(request, context);
  } catch (error) {
    rethrowIfNextControlFlow(error);
    console.error("Error in GET /api/tax-reports (wrapper):", error);
    return emptyReports();
  }
}
