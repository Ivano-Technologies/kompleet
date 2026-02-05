import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { TaxComputationService } from '@/lib/services/tax-computation-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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
    } = body;

    // Validate required fields
    if (!reportType || !taxYear || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare computation input
    const computationInput = {
      businessType: businessType || 'other_company',
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

    // Compute tax
    const computation = TaxComputationService.computeTax(computationInput);

    // Save tax report to database
    const { data: taxReport, error: saveError } = await supabase
      .from('tax_reports')
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
        status: 'draft',
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving tax report:', saveError);
      return NextResponse.json({ error: saveError.message }, { status: 400 });
    }

    return NextResponse.json({ report: taxReport, computation });
  } catch (error: any) {
    console.error('Error in POST /api/tax-reports/generate:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
