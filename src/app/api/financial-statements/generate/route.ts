/**
 * Financial Statement Generation API
 * POST /api/financial-statements/generate
 * Generates Income Statement and Tax Computation
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import {
  generateIncomeStatement,
  generateIncomeStatementHTML,
} from "@/lib/financial-statements/income-statement";
import {
  generateTaxComputation,
  generateTaxComputationHTML,
} from "@/lib/financial-statements/tax-computation";
import { withRateLimit } from "@/lib/with-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await getSupabaseForRequest(request);

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { startDate, endDate, entityType, annualTurnover, format } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing startDate or endDate" },
        { status: 400 },
      );
    }

    // Fetch transactions for the period
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select(
        `
        *,
        category:categories(name, type)
      `,
      )
      .eq("user_id", user.id)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: true });

    if (transactionsError) {
      throw transactionsError;
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions found for the specified period" },
        { status: 404 },
      );
    }

    // Generate Income Statement
    const incomeStatement = generateIncomeStatement(
      transactions,
      startDate,
      endDate,
    );

    // Generate Tax Computation
    const taxComputation = generateTaxComputation(
      incomeStatement,
      entityType || "individual",
      annualTurnover || incomeStatement.revenue.total,
    );

    // Return data based on format
    if (format === "html") {
      const incomeStatementHTML = generateIncomeStatementHTML(incomeStatement);
      const taxComputationHTML = generateTaxComputationHTML(taxComputation);

      return NextResponse.json({
        success: true,
        incomeStatementHTML,
        taxComputationHTML,
      });
    }

    return NextResponse.json({
      success: true,
      incomeStatement,
      taxComputation,
    });
  } catch (error) {
    console.error("Generate financial statements error:", error);
    return NextResponse.json(
      { error: "Failed to generate financial statements" },
      { status: 500 },
    );
  }
}

// Apply rate limiting (20 requests per minute for expensive financial statement generation)
export const POST = withRateLimit(handlePOST, { limit: 20 });
