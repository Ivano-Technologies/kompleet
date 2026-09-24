/**
 * Save Tax Calculation API
 * POST /api/calculations/save
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { saveCalculationSchema } from "@/lib/schemas/calculations";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const parsed = saveCalculationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      tax_type,
      tax_year,
      input_data,
      gross_amount,
      taxable_amount,
      tax_due,
      breakdown,
    } = parsed.data;

    const saved = await convex.mutation(api.tax.saveCalculation, {
      taxType: tax_type,
      taxYear: tax_year,
      calculationDate:
        parsed.data.calculation_date ||
        new Date().toISOString().split("T")[0],
      inputData: input_data,
      grossAmount: gross_amount,
      deductions: parsed.data.deductions ?? 0,
      taxableAmount: taxable_amount,
      taxDue: tax_due,
      effectiveRate: parsed.data.effective_rate ?? undefined,
      breakdown,
      isFinal: parsed.data.is_final ?? false,
    });

    const calculation = saved.id
      ? await convex.query(api.tax.getCalculation, { externalId: saved.id })
      : saved;

    await convex.mutation(api.audit.append, {
      action: "create",
      resourceType: "tax_calculation",
      entityId: saved.id,
      metadata: { tax_type, tax_year },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      calculation,
      message: "Calculation saved successfully",
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }
    console.error("[Save Calculation Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 30 });
