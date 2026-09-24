/**
 * NRS Filing Generation API
 * POST /api/nrs-filing/generate
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { generateIncomeStatement } from "@/lib/financial-statements/income-statement";
import { computeTaxForPeriod } from "@/lib/financial-statements/compute-tax-for-period";
import { loadRuleBundle } from "@/lib/tax/rule-loader";
import { MissingTaxRuleError } from "@/lib/tax/errors";
import {
  generatePITForm,
  generateCITForm,
  generatePITFormHTML,
  generateCITFormHTML,
} from "@/lib/nrs-filing/form-generator";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { listStatementTransactions } from "@/lib/convex/statement-txns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const {
      formType,
      taxYear,
      startDate,
      endDate,
      taxpayerInfo,
      entityType,
      annualTurnover,
      taxPaid,
      format,
    } = body as {
      formType?: string;
      taxYear?: number;
      startDate?: string;
      endDate?: string;
      taxpayerInfo?: { name: string; tin: string };
      entityType?: string;
      annualTurnover?: number;
      taxPaid?: number;
      format?: string;
    };

    if (!formType || !taxYear || !startDate || !endDate || !taxpayerInfo) {
      return NextResponse.json(
        { error: "Missing required parameters" },
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

    if (formType === "PIT") {
      const pitForm = generatePITForm(
        taxpayerInfo,
        taxComputation,
        taxYear,
        taxPaid || 0,
      );
      if (format === "html") {
        return NextResponse.json({
          success: true,
          formType: "PIT",
          html: generatePITFormHTML(pitForm),
        });
      }
      return NextResponse.json({
        success: true,
        formType: "PIT",
        data: pitForm,
      });
    }

    if (formType === "CIT") {
      const citForm = generateCITForm(
        taxpayerInfo,
        incomeStatement,
        taxComputation,
        taxYear,
        taxPaid || 0,
      );
      if (format === "html") {
        return NextResponse.json({
          success: true,
          formType: "CIT",
          html: generateCITFormHTML(citForm),
        });
      }
      return NextResponse.json({
        success: true,
        formType: "CIT",
        data: citForm,
      });
    }

    return NextResponse.json(
      { error: "Invalid form type. Must be PIT or CIT" },
      { status: 400 },
    );
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Generate NRS form error:", error);
    if (error instanceof MissingTaxRuleError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Failed to generate NRS form" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 20 });
