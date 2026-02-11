/**
 * Save Tax Calculation API
 * POST /api/calculations/save - Save a new tax calculation
 * Protected: Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/with-rate-limit';

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const { tax_type, tax_year, input_data, gross_amount, taxable_amount, tax_due, breakdown } =
      body;

    if (
      !tax_type ||
      !tax_year ||
      !input_data ||
      gross_amount === undefined ||
      taxable_amount === undefined ||
      tax_due === undefined ||
      !breakdown
    ) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: 'Missing required fields: tax_type, tax_year, input_data, amounts, breakdown',
        },
        { status: 400 }
      );
    }

    // Validate tax_type
    const validTaxTypes = ['pit', 'cit', 'vat', 'wht'];
    if (!validTaxTypes.includes(tax_type)) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: `Invalid tax_type. Must be one of: ${validTaxTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate tax_year
    if (tax_year < 2000 || tax_year > 2100) {
      return NextResponse.json(
        { error: 'Validation error', message: 'tax_year must be between 2000 and 2100' },
        { status: 400 }
      );
    }

    // Validate amounts are non-negative
    if (
      gross_amount < 0 ||
      taxable_amount < 0 ||
      tax_due < 0 ||
      (body.deductions !== undefined && body.deductions < 0)
    ) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Amounts must be non-negative' },
        { status: 400 }
      );
    }

    // Insert calculation
    const { data: calculation, error: insertError } = await supabase
      .from('tax_calculations')
      .insert({
        user_id: user.id,
        tax_type,
        tax_year,
        calculation_date: body.calculation_date || new Date().toISOString().split('T')[0],
        input_data,
        gross_amount,
        deductions: body.deductions || 0,
        taxable_amount,
        tax_due,
        effective_rate: body.effective_rate || null,
        breakdown,
        is_final: body.is_final || false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Save Calculation Error]', insertError);
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to save calculation' },
        { status: 500 }
      );
    }

    // Log successful save
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'create',
      resource_type: 'tax_calculation',
      resource_id: calculation.id,
      metadata: {
        tax_type,
        tax_year,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      calculation,
      message: 'Calculation saved successfully',
    });
  } catch (error) {
    console.error('[Save Calculation Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting (30 saves per minute)
export const POST = withRateLimit(handlePOST, { limit: 30 });
