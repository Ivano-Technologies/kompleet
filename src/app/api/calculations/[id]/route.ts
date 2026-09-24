/**
 * Individual Tax Calculation API
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { updateCalculationSchema } from "@/lib/schemas/calculations";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handleGET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { convex } = await requireAuthedConvex(request);
    const calculation = await convex.query(api.tax.getCalculation, {
      externalId: id,
    });
    if (!calculation) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Calculation not found or access denied",
        },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, calculation });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }
    console.error("[Get Calculation Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const parsed = updateCalculationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updates = parsed.data;
    try {
      const calculation = await convex.mutation(api.tax.updateCalculation, {
        externalId: id,
        inputData: updates.input_data,
        grossAmount: updates.gross_amount,
        deductions: updates.deductions,
        taxableAmount: updates.taxable_amount,
        taxDue: updates.tax_due,
        effectiveRate: updates.effective_rate ?? undefined,
        breakdown: updates.breakdown,
      });
      await convex.mutation(api.audit.append, {
        action: "update",
        resourceType: "tax_calculation",
        entityId: id,
        metadata: { updated_fields: Object.keys(updates) },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
      });
      return NextResponse.json({
        success: true,
        calculation,
        message: "Calculation updated successfully",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("finalized")) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Cannot update finalized calculations",
          },
          { status: 403 },
        );
      }
      if (message.includes("not found")) {
        return NextResponse.json(
          {
            error: "Not found",
            message: "Calculation not found or access denied",
          },
          { status: 404 },
        );
      }
      throw err;
    }
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }
    console.error("[Update Calculation Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleDELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { convex } = await requireAuthedConvex(request);
    try {
      await convex.mutation(api.tax.deleteCalculation, { externalId: id });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("finalized")) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Cannot delete finalized calculations",
          },
          { status: 403 },
        );
      }
      if (message.includes("not found")) {
        return NextResponse.json(
          {
            error: "Not found",
            message: "Calculation not found or access denied",
          },
          { status: 404 },
        );
      }
      throw err;
    }

    await convex.mutation(api.audit.append, {
      action: "delete",
      resourceType: "tax_calculation",
      entityId: id,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Calculation deleted successfully",
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }
    console.error("[Delete Calculation Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
export const PATCH = withRateLimit(handlePATCH);
export const DELETE = withRateLimit(handleDELETE);
