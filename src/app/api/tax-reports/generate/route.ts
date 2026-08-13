import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { TaxComputationService } from "@/lib/services/tax-computation-service";
import { loadRuleBundle } from "@/lib/tax/rule-loader";
import { MissingTaxRuleError } from "@/lib/tax/errors";
import { withRateLimit } from "@/lib/with-rate-limit";
import { z } from "zod";

const taxReportSchema = z.object({
  reportType: z.string().min(1),
  taxYear: z.number().int().min(2000).max(2100),
  periodStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  periodEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  businessType: z.string().optional(),
  turnover: z.number().min(0).optional(),
  totalAssets: z.number().min(0).optional(),
  isProfessionalService: z.boolean().optional(),
  totalRevenue: z.number().min(0).optional(),
  totalExpenses: z.number().min(0).optional(),
  capitalGains: z.number().min(0).optional(),
  capitalLosses: z.number().min(0).optional(),
  nonDeductibleExpenses: z.number().min(0).optional(),
  annualIncome: z.number().min(0).optional(),
  rentPaid: z.number().min(0).optional(),
  ownerOccupierInterest: z.number().min(0).optional(),
});

export const runtime = "nodejs";

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

    const body = await request.json();
    const parsed = taxReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      reportType,
      taxYear,
      periodStart,
      periodEnd,
      businessType,
      turnover,
      totalAssets,
      isProfessionalService,
      totalRevenue,
      totalExpenses,
      capitalGains,
      capitalLosses,
      nonDeductibleExpenses,
      annualIncome,
      rentPaid,
      ownerOccupierInterest,
    } = parsed.data;

    // Prepare computation input
    const validBusinessTypes = [
      "individual",
      "small_company",
      "other_company",
      "very_large_company",
    ] as const;
    const resolvedBusinessType = validBusinessTypes.includes(
      businessType as (typeof validBusinessTypes)[number],
    )
      ? (businessType as (typeof validBusinessTypes)[number])
      : "other_company";

    const computationInput = {
      businessType: resolvedBusinessType,
      turnover: turnover || 0,
      totalAssets: totalAssets || 0,
      isProfessionalService: isProfessionalService || false,
      totalRevenue: totalRevenue || 0,
      totalExpenses: totalExpenses || 0,
      capitalGains: capitalGains || 0,
      capitalLosses: capitalLosses || 0,
      nonDeductibleExpenses: nonDeductibleExpenses || 0,
      annualIncome,
      rentPaid,
      ownerOccupierInterest,
    };

    // Load tax rules (active version, gaps filled from the latest
    // unverified candidate version) and compute tax.
    const rules = await loadRuleBundle({ client: supabase });
    const computation = TaxComputationService.computeTax(
      computationInput,
      rules,
    );

    // Save tax report to database
    const { data: taxReport, error: saveError } = await supabase
      .from("tax_reports")
      .insert({
        user_id: user.id,
        report_type: reportType,
        tax_year: taxYear,
        period_start: periodStart,
        period_end: periodEnd,
        business_classification: computation.businessClassification,
        qualifies_as_small_company: computation.qualifiesAsSmallCompany,
        total_revenue: computation.grossIncome,
        total_expenses: computationInput.totalExpenses,
        assessable_profit: computation.assessableProfit,
        taxable_income: computation.taxableIncome,
        income_tax: computation.incomeTax,
        development_levy: computation.developmentLevy,
        total_tax_liability: computation.totalTaxLiability,
        effective_tax_rate: computation.effectiveTaxRate,
        computation_data: computation,
        status: "draft",
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving tax report:", saveError);
      return NextResponse.json({ error: saveError.message }, { status: 400 });
    }

    return NextResponse.json({ report: taxReport, computation });
  } catch (error: any) {
    console.error("Error in POST /api/tax-reports/generate:", error);
    if (error instanceof MissingTaxRuleError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 20 });
