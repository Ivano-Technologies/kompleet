import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

export const runtime = "nodejs";

async function handleGET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const { id } = await context.params;
    const report = await convex.query(api.tax.getReport, { externalId: id });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json({ report });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in GET /api/tax-reports/[id]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

async function handlePATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const { id } = await context.params;
    const body = await request.json();
    const { status, filed_at, paid_at, payment_reference } = body as {
      status?: string;
      filed_at?: string;
      paid_at?: string;
      payment_reference?: string;
    };
    const patch: Record<string, unknown> = {};
    if (status) patch.status = status;
    if (filed_at) patch.filed_at = filed_at;
    if (paid_at) patch.paid_at = paid_at;
    if (payment_reference) patch.payment_reference = payment_reference;

    const report = await convex.mutation(api.tax.updateReport, {
      externalId: id,
      patch,
    });
    return NextResponse.json({ report });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in PATCH /api/tax-reports/[id]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 400 },
    );
  }
}

async function handleDELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const { id } = await context.params;
    await convex.mutation(api.tax.deleteReport, { externalId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in DELETE /api/tax-reports/[id]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 400 },
    );
  }
}

export const GET = withRateLimit(handleGET);
export const PATCH = withRateLimit(handlePATCH);
export const DELETE = withRateLimit(handleDELETE);
