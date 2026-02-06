import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get year from query params
    const searchParams = request.nextUrl.searchParams;
    const currentYear = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10);
    const previousYear = currentYear - 1;

    // Fetch current year transactions
    const { data: currentTransactions, error: currentError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', user.id)
      .eq('tax_year', currentYear);

    if (currentError) {
      console.error('Error fetching current year transactions:', currentError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Fetch previous year transactions
    const { data: previousTransactions, error: previousError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', user.id)
      .eq('tax_year', previousYear);

    if (previousError) {
      console.error('Error fetching previous year transactions:', previousError);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    // Calculate totals for current year
    const currentIncome = currentTransactions
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    const currentExpenses = currentTransactions
      ?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    // Calculate totals for previous year
    const previousIncome = previousTransactions
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    const previousExpenses = previousTransactions
      ?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    // Calculate tax (simplified - 20% of net income)
    const currentNetIncome = currentIncome - currentExpenses;
    const previousNetIncome = previousIncome - previousExpenses;
    const currentTax = Math.max(0, currentNetIncome * 0.20);
    const previousTax = Math.max(0, previousNetIncome * 0.20);

    // Calculate changes
    const incomeChange = currentIncome - previousIncome;
    const incomeChangePercent = previousIncome > 0 
      ? (incomeChange / previousIncome) * 100 
      : 0;

    const expensesChange = currentExpenses - previousExpenses;
    const expensesChangePercent = previousExpenses > 0 
      ? (expensesChange / previousExpenses) * 100 
      : 0;

    const taxChange = currentTax - previousTax;
    const taxChangePercent = previousTax > 0 
      ? (taxChange / previousTax) * 100 
      : 0;

    const netIncomeChange = currentNetIncome - previousNetIncome;
    const netIncomeChangePercent = previousNetIncome > 0 
      ? (netIncomeChange / previousNetIncome) * 100 
      : 0;

    // Return YoY comparison data
    return NextResponse.json({
      income: {
        current: currentIncome,
        previous: previousIncome,
        change: incomeChange,
        changePercent: incomeChangePercent
      },
      expenses: {
        current: currentExpenses,
        previous: previousExpenses,
        change: expensesChange,
        changePercent: expensesChangePercent
      },
      tax: {
        current: currentTax,
        previous: previousTax,
        change: taxChange,
        changePercent: taxChangePercent
      },
      netIncome: {
        current: currentNetIncome,
        previous: previousNetIncome,
        change: netIncomeChange,
        changePercent: netIncomeChangePercent
      }
    });
  } catch (error) {
    console.error('Error in /api/analytics/yoy/summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
