/**
 * Duplicate Resolution API
 * GET /api/transactions/duplicates - Get pending duplicates
 * POST /api/transactions/duplicates - Resolve duplicate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/with-rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Get pending duplicate candidates
 */
async function handleGET(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    // Build query
    let query = supabase
      .from('duplicate_candidates')
      .select(`
        *,
        import_sessions!inner(user_id, file_name, bank_code)
      `)
      .eq('import_sessions.user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: duplicates, error: duplicatesError } = await query;

    if (duplicatesError) {
      throw duplicatesError;
    }

    return NextResponse.json({
      duplicates,
      total: duplicates?.length || 0,
    });

  } catch (error) {
    console.error('Get duplicates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch duplicates' },
      { status: 500 }
    );
  }
}

/**
 * Resolve duplicate candidate
 */
async function handlePOST(request: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { duplicateId, action } = body; // action: 'merged', 'kept_both', 'rejected'

    if (!duplicateId || !action) {
      return NextResponse.json(
        { error: 'Missing duplicateId or action' },
        { status: 400 }
      );
    }

    if (!['merged', 'kept_both', 'rejected'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get duplicate candidate
    const { data: duplicate, error: duplicateError } = await supabase
      .from('duplicate_candidates')
      .select(`
        *,
        import_sessions!inner(user_id)
      `)
      .eq('id', duplicateId)
      .eq('import_sessions.user_id', user.id)
      .single();

    if (duplicateError || !duplicate) {
      return NextResponse.json({ error: 'Duplicate not found' }, { status: 404 });
    }

    if (action === 'merged') {
      await supabase
        .from('duplicate_candidates')
        .update({
          status: 'merged',
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', duplicateId);

      return NextResponse.json({
        success: true,
        message: 'Duplicate merged with existing transaction',
      });
    }

    if (action === 'kept_both') {
      const newTransaction = duplicate.new_transaction_data;

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          transaction_date: newTransaction.date,
          description: newTransaction.merchant,
          amount: newTransaction.amount,
          transaction_type: newTransaction.type,
          balance: newTransaction.balance,
          reference: newTransaction.reference,
          source: `${newTransaction.metadata.bankCode}_import`,
          metadata: newTransaction.metadata,
        });

      if (insertError) {
        throw insertError;
      }

      await supabase
        .from('duplicate_candidates')
        .update({
          status: 'kept_both',
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', duplicateId);

      return NextResponse.json({
        success: true,
        message: 'Both transactions kept',
      });
    }

    if (action === 'rejected') {
      await supabase
        .from('duplicate_candidates')
        .update({
          status: 'rejected',
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', duplicateId);

      return NextResponse.json({
        success: true,
        message: 'New transaction rejected',
      });
    }

    // 🔒 Fallback (should never happen, but satisfies TS exhaustiveness)
    return NextResponse.json(
      { error: 'Unhandled action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Resolve duplicate error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve duplicate' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET);
export const POST = withRateLimit(handlePOST);
