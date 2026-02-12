import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/with-rate-limit';

async function handleGET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const searchParams = request.nextUrl.searchParams;

    // Get query parameters
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq('calculator_type', type);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    if (search) {
      // Search in input_data and result_data JSON fields
      // Note: This is a simple text search, might need optimization for production
      query = query.or(`input_data.cs.*${search}*,result_data.cs.*${search}*`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calculation history' },
        { status: 500 }
      );
    }

    // Transform data to match expected format
    const transformedData = (data || []).map((item) => ({
      id: item.id,
      calculation_type: item.calculator_type,
      inputs: item.input_data || {},
      results: item.result_data || {},
      rule_version_id: item.rule_version_id,
      created_at: item.created_at,
    }));

    return NextResponse.json({
      data: transformedData,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET);
