import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { FinancialStatementsService } from '@/lib/services/financial-statements-service';

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
    const asOfDate = searchParams.get('asOfDate');

    if (!asOfDate) {
      return NextResponse.json(
        { error: 'asOfDate is required' },
        { status: 400 }
      );
    }

    // Fetch all transactions for the user
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(id, name, category_type, tax_treatment)
      `)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: true });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Generate Balance Sheet
    const statement = FinancialStatementsService.generateBalanceSheet(
      transactions,
      asOfDate
    );

    // Save to database for history
    const { error: saveError } = await supabase
      .from('financial_statements')
      .insert({
        user_id: user.id,
        statement_type: 'balance_sheet',
        period_start: asOfDate,
        period_end: asOfDate,
        data: statement,
        metadata: {
          generated_at: new Date().toISOString(),
          transaction_count: transactions.length,
        },
      });

    if (saveError) {
      console.error('Error saving statement:', saveError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ statement });
  } catch (error: any) {
    console.error('Error in GET /api/reports/balance-sheet:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
