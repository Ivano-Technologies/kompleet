/**
 * Tax Calculations History API
 * GET /api/calculations - Get all calculations for current user with optional filters
 * Protected: Requires authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handleGET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const tax_type = searchParams.get("tax_type");
    const tax_year = searchParams.get("tax_year");
    const is_final = searchParams.get("is_final");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build query
    let query = supabase
      .from("tax_calculations")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (tax_type && ["pit", "cit", "vat", "wht"].includes(tax_type)) {
      query = query.eq("tax_type", tax_type);
    }

    if (tax_year) {
      const year = parseInt(tax_year, 10);
      if (year >= 2000 && year <= 2100) {
        query = query.eq("tax_year", year);
      }
    }

    if (is_final === "true") {
      query = query.eq("is_final", true);
    } else if (is_final === "false") {
      query = query.eq("is_final", false);
    }

    // Execute query
    const { data: calculations, error: queryError, count } = await query;

    if (queryError) {
      console.error("[Get Calculations Error]", queryError);
      return NextResponse.json(
        { error: "Database error", message: "Failed to retrieve calculations" },
        { status: 500 },
      );
    }

    // Transform amounts from kobo to naira for display (optional - can be done in frontend)
    const formattedCalculations = calculations.map((calc) => ({
      ...calc,
      // Keep kobo values for accuracy, add formatted versions
      amounts: {
        gross: calc.gross_amount,
        deductions: calc.deductions,
        taxable: calc.taxable_amount,
        tax_due: calc.tax_due,
        // Formatted for display
        gross_naira: calc.gross_amount / 100,
        deductions_naira: calc.deductions / 100,
        taxable_naira: calc.taxable_amount / 100,
        tax_due_naira: calc.tax_due / 100,
      },
    }));

    return NextResponse.json({
      success: true,
      calculations: formattedCalculations,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
      filters: {
        tax_type: tax_type || "all",
        tax_year: tax_year ? parseInt(tax_year) : "all",
        is_final: is_final || "all",
      },
    });
  } catch (error) {
    console.error("[Get Calculations Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
