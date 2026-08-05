/**
 * NRS Filing Generation API
 * POST /api/nrs-filing/generate
 * Generates NRS tax forms (PIT, CIT, VAT)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
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
    const {
      formType, // 'PIT' or 'CIT'
      taxYear,
      startDate,
      endDate,
      taxpayerInfo, // { name, tin }
      entityType, // 'individual' or 'company'
      annualTurnover,
      taxPaid,
      format, // 'json' or 'html'
    } = body;

    if (!formType || !taxYear || !startDate || !endDate || !taxpayerInfo) {
      return NextResponse.json(
        { error: "Missing required parameters" },
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

    // Compute tax via the shared FS/NRS helper (see
    // src/lib/financial-statements/compute-tax-for-period.ts) so figures
    // stay identical to /api/financial-statements/generate for the same
    // inputs.
    const rules = await loadRuleBundle({ client: supabase });
    const { data: taxComputation } = computeTaxForPeriod({
      incomeStatement,
      entityType: entityType === "company" ? "company" : "individual",
      annualTurnover: annualTurnover || incomeStatement.revenue.total,
      rules,
    });

    // Generate appropriate form
    if (formType === "PIT") {
      const pitForm = generatePITForm(
        taxpayerInfo,
        taxComputation,
        taxYear,
        taxPaid || 0,
      );

      if (format === "html") {
        const html = generatePITFormHTML(pitForm);
        return NextResponse.json({
          success: true,
          formType: "PIT",
          html,
        });
      }

      return NextResponse.json({
        success: true,
        formType: "PIT",
        data: pitForm,
      });
    } else if (formType === "CIT") {
      const citForm = generateCITForm(
        taxpayerInfo,
        incomeStatement,
        taxComputation,
        taxYear,
        taxPaid || 0,
      );

      if (format === "html") {
        const html = generateCITFormHTML(citForm);
        return NextResponse.json({
          success: true,
          formType: "CIT",
          html,
        });
      }

      return NextResponse.json({
        success: true,
        formType: "CIT",
        data: citForm,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid form type. Must be PIT or CIT" },
        { status: 400 },
      );
    }
  } catch (error) {
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
