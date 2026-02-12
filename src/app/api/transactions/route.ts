import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/with-rate-limit';

export const runtime = 'nodejs';

interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: 'debit' | 'credit';
  search?: string;
  page?: number;
  limit?: number;
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters: TransactionFilters = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      type: (searchParams.get('type') as 'debit' | 'credit') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };
    
    // Build query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories(id, name, category_type, tax_treatment)
      `, { count: 'exact' })
      .eq('user_id', user.id);
    
    // Apply filters
    if (filters.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }
    
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    if (filters.type) {
      query = query.eq('transaction_type', filters.type);
    }
    
    if (filters.search) {
      query = query.ilike('description', `%${filters.search}%`);
    }
    
    // Apply pagination
    const from = (filters.page! - 1) * filters.limit!;
    const to = from + filters.limit! - 1;
    
    query = query
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);
    
    const { data: transactions, error, count } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      transactions,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / filters.limit!),
      },
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No transaction IDs provided' },
        { status: 400 }
      );
    }
    
    // Delete transactions (RLS ensures user can only delete their own)
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', ids)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting transactions:', error);
      return NextResponse.json(
        { error: 'Failed to delete transactions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Deleted ${ids.length} transaction(s)`,
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET);
export const DELETE = withRateLimit(handleDELETE);
