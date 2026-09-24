/**
 * Finalize Tax Calculation API
 * POST /api/calculations/[id]/finalize
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handlePOST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { convex } = await requireAuthedConvex(request);

    const existing = await convex.query(api.tax.getCalculation, {
      externalId: id,
    });
    if (!existing) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Calculation not found or access denied",
        },
        { status: 404 },
      );
    }
    if (existing.is_final) {
      return NextResponse.json(
        {
          error: "Already finalized",
          message: "This calculation is already marked as final",
        },
        { status: 400 },
      );
    }

    const calculation = await convex.mutation(api.tax.finalizeCalculation, {
      externalId: id,
    });

    await convex.mutation(api.audit.append, {
      action: "update",
      resourceType: "tax_calculation",
      entityId: id,
      metadata: {
        action: "finalized",
        tax_type: existing.tax_type,
        tax_year: existing.tax_year,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      calculation,
      message:
        "Calculation finalized successfully. This calculation is now locked and cannot be modified.",
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }
    console.error("[Finalize Calculation Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST);
