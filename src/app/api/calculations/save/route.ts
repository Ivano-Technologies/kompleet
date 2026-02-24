/**
 * Save Tax Calculation API
 * POST /api/calculations/save - Save a new tax calculation
 * Protected: Requires authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { saveCalculationSchema } from "@/lib/schemas/calculations";

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await getSupabaseForRequest(request);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }

    // Parse and validate request body
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

    // Insert calculation
    const { data: calculation, error: insertError } = await supabase
      .from("tax_calculations")
      .insert({
        user_id: user.id,
        tax_type,
        tax_year,
        calculation_date:
          parsed.data.calculation_date ||
          new Date().toISOString().split("T")[0],
        input_data,
        gross_amount,
        deductions: parsed.data.deductions ?? 0,
        taxable_amount,
        tax_due,
        effective_rate: parsed.data.effective_rate ?? null,
        breakdown,
        is_final: parsed.data.is_final ?? false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Save Calculation Error]", insertError);
      return NextResponse.json(
        { error: "Database error", message: "Failed to save calculation" },
        { status: 500 },
      );
    }

    // Log successful save
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "create",
      resource_type: "tax_calculation",
      resource_id: calculation.id,
      metadata: {
        tax_type,
        tax_year,
      },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      calculation,
      message: "Calculation saved successfully",
    });
  } catch (error) {
    console.error("[Save Calculation Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Apply rate limiting (30 saves per minute)
export const POST = withRateLimit(handlePOST, { limit: 30 });
