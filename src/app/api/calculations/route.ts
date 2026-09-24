/**
 * Tax Calculations History API
 * GET /api/calculations
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const searchParams = request.nextUrl.searchParams;
    const tax_type = searchParams.get("tax_type");
    const tax_year = searchParams.get("tax_year");
    const is_final = searchParams.get("is_final");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let calculations = await convex.query(api.tax.listCalculations, {});
    if (tax_type && ["pit", "cit", "vat", "wht"].includes(tax_type)) {
      calculations = calculations.filter((c) => c.tax_type === tax_type);
    }
    if (tax_year) {
      const year = parseInt(tax_year, 10);
      if (year >= 2000 && year <= 2100) {
        calculations = calculations.filter((c) => c.tax_year === year);
      }
    }
    if (is_final === "true") {
      calculations = calculations.filter((c) => c.is_final);
    } else if (is_final === "false") {
      calculations = calculations.filter((c) => !c.is_final);
    }

    const total = calculations.length;
    const page = calculations.slice(offset, offset + limit);
    const formattedCalculations = page.map((calc) => ({
      ...calc,
      amounts: {
        gross: calc.gross_amount,
        deductions: calc.deductions,
        taxable: calc.taxable_amount,
        tax_due: calc.tax_due,
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
        total,
        limit,
        offset,
        hasMore: total > offset + limit,
      },
      filters: {
        tax_type: tax_type || "all",
        tax_year: tax_year ? parseInt(tax_year, 10) : "all",
        is_final: is_final || "all",
      },
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }
    console.error("[Get Calculations Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
