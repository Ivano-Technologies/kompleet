/**
 * Finalize Tax Calculation API
 * POST /api/calculations/[id]/finalize - Mark a calculation as final (locked)
 * Protected: Requires authentication + ownership (via RLS)
 *
 * Once finalized, calculations cannot be modified or deleted.
 * This is intended for calculations that have been filed with FIRS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    // Check if calculation exists and is not already finalized
    const { data: existing, error: checkError } = await supabase
      .from('tax_calculations')
      .select('is_final, tax_type, tax_year')
      .eq('id', id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Not found', message: 'Calculation not found or access denied' },
        { status: 404 }
      );
    }

    if (existing.is_final) {
      return NextResponse.json(
        {
          error: 'Already finalized',
          message: 'This calculation is already marked as final',
        },
        { status: 400 }
      );
    }

    // Mark as final
    const { data: calculation, error: updateError } = await supabase
      .from('tax_calculations')
      .update({ is_final: true })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[Finalize Calculation Error]', updateError);
      return NextResponse.json(
        { error: 'Database error', message: 'Failed to finalize calculation' },
        { status: 500 }
      );
    }

    // Log finalization
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'update',
      resource_type: 'tax_calculation',
      resource_id: id,
      metadata: {
        action: 'finalized',
        tax_type: existing.tax_type,
        tax_year: existing.tax_year,
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      calculation,
      message:
        'Calculation finalized successfully. This calculation is now locked and cannot be modified.',
    });
  } catch (error) {
    console.error('[Finalize Calculation Error]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
