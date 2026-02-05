import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

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
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');

    // Build query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, category_type, tax_treatment)
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false });

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }
    if (type) {
      query = query.eq('transaction_type', type);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Date',
        'Description',
        'Type',
        'Amount',
        'Balance',
        'Category',
        'Category Type',
        'Tax Treatment',
        'Reference',
        'Notes',
        'Reconciled'
      ];

      const rows = transactions.map((t: any) => [
        t.transaction_date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.transaction_type,
        t.amount,
        t.balance || '',
        t.category?.name || 'Uncategorized',
        t.category?.category_type || '',
        t.category?.tax_treatment || '',
        t.reference || '',
        t.notes ? `"${t.notes.replace(/"/g, '""')}"` : '',
        t.is_reconciled ? 'Yes' : 'No'
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      // Return JSON
      return NextResponse.json({ transactions });
    } else {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in GET /api/transactions/export:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
