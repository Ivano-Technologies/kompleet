import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const taxYearRaw = request.nextUrl.searchParams.get("taxYear");
    const taxYear = taxYearRaw ? Number(taxYearRaw) : undefined;
    const invoices = await convex.query(api.invoices.listMine, {
      status: status === "all" ? undefined : status,
      taxYear: Number.isFinite(taxYear) ? taxYear : undefined,
    });
    return NextResponse.json({ invoices });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[List invoices]", error);
    return NextResponse.json(
      { error: "Failed to list invoices" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
