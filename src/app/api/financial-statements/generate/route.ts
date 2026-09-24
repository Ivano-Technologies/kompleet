/**
 * Financial Statement Generation API
 * POST /api/financial-statements/generate
 * Generates Income Statement and Tax Computation
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateIncomeStatement,
  generateIncomeStatementHTML,
} from "@/lib/financial-statements/income-statement";
import { generateTaxComputationHTML } from "@/lib/financial-statements/tax-computation-html";
import { computeTaxForPeriod } from "@/lib/financial-statements/compute-tax-for-period";
import { loadRuleBundle } from "@/lib/tax/rule-loader";
import { MissingTaxRuleError } from "@/lib/tax/errors";
import { withRateLimit } from "@/lib/with-rate-limit";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { listStatementTransactions } from "@/lib/convex/statement-txns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const { startDate, endDate, entityType, annualTurnover, format } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing startDate or endDate" },
        { status: 400 },
      );
    }

    const transactions = await listStatementTransactions(convex, {
      startDate,
      endDate,
    });

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions found for the specified period" },
        { status: 404 },
      );
    }

    const incomeStatement = generateIncomeStatement(
      transactions,
      startDate,
      endDate,
    );

    const rules = await loadRuleBundle({ convex });
    const { data: taxComputation } = computeTaxForPeriod({
      incomeStatement,
      entityType: entityType === "company" ? "company" : "individual",
      annualTurnover: annualTurnover || incomeStatement.revenue.total,
      rules,
    });

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
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Generate financial statements error:", error);
    if (error instanceof MissingTaxRuleError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Failed to generate financial statements" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 20 });
