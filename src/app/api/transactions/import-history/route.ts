/**
 * Import History API
 * GET /api/transactions/import-history
 * Returns user's import session history with stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const bankCode = searchParams.get('bankCode');
    const status = searchParams.get('status');
    
    // Build query
    let query = supabase
      .from('import_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (bankCode) {
      query = query.eq('bank_code', bankCode.toUpperCase());
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: sessions, error: sessionsError, count } = await query;
    
    if (sessionsError) {
      throw sessionsError;
    }
    
    // Get error counts for each session
    const sessionIds = sessions?.map(s => s.id) || [];
    
    const { data: errors } = await supabase
      .from('import_errors')
      .select('session_id, error_type')
      .in('session_id', sessionIds);
    
    // Get duplicate counts
    const { data: duplicates } = await supabase
      .from('duplicate_candidates')
      .select('session_id, status')
      .in('session_id', sessionIds);
    
    // Aggregate stats by session
    const errorsBySession = new Map<string, number>();
    const duplicatesBySession = new Map<string, number>();
    
    errors?.forEach(error => {
      const count = errorsBySession.get(error.session_id) || 0;
      errorsBySession.set(error.session_id, count + 1);
    });
    
    duplicates?.forEach(dup => {
      const count = duplicatesBySession.get(dup.session_id) || 0;
      duplicatesBySession.set(dup.session_id, count + 1);
    });
    
    // Enrich sessions with stats
    const enrichedSessions = sessions?.map(session => ({
      ...session,
      errorsCount: errorsBySession.get(session.id) || 0,
      duplicatesCount: duplicatesBySession.get(session.id) || 0,
    }));
    
    return NextResponse.json({
      sessions: enrichedSessions,
      total: count,
      limit,
      offset,
    });
    
  } catch (error) {
    console.error('Import history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch import history' },
      { status: 500 }
    );
  }
}
