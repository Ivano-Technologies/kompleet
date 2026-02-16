import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/with-rate-limit';
import { withAudit } from '@/lib/with-audit';
import { z } from 'zod';

export const runtime = 'nodejs';

const exportQuerySchema = z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  type: z.enum(['debit', 'credit']).optional(),
});

async function handleGET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = exportQuerySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { format, startDate, endDate, type } = parsed.data;

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

    // Enforce size limit to prevent memory exhaustion
    const MAX_EXPORT = 50000;
    if (transactions && transactions.length > MAX_EXPORT) {
      return NextResponse.json(
        { error: `Export limited to ${MAX_EXPORT.toLocaleString()} transactions. Please use date filters to narrow your results.` },
        { status: 400 }
      );
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

export const GET = withRateLimit(withAudit(handleGET, { action: 'export', resourceType: 'transactions' }));
