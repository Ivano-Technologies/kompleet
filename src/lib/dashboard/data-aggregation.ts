import { createServerClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface MonthlyIncomeExpense {
  month: string;
  income: number;
  expenses: number;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
  percentage: number;
}

export interface TaxProjection {
  month: string;
  projected: number;
  actual: number;
}

export interface ComplianceMetrics {
  categorizedTransactions: number;
  totalTransactions: number;
  reconciliationRate: number;
  taxReadinessScore: number;
}

/**
 * Get monthly income vs expenses for the last 6 months
 */
export async function getMonthlyIncomeExpenses(
  userId: string,
  months: number = 6
): Promise<MonthlyIncomeExpense[]> {
  const supabase = await createServerClient();
  const result: MonthlyIncomeExpense[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const targetDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // Get income (credits)
    const { data: incomeData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('transaction_type', 'credit')
      .gte('transaction_date', monthStart.toISOString().split('T')[0])
      .lte('transaction_date', monthEnd.toISOString().split('T')[0]);

    // Get expenses (debits)
    const { data: expenseData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('transaction_type', 'debit')
      .gte('transaction_date', monthStart.toISOString().split('T')[0])
      .lte('transaction_date', monthEnd.toISOString().split('T')[0]);

    const income = incomeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const expenses = expenseData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    result.push({
      month: format(targetDate, 'MMM yyyy'),
      income: Math.round(income),
      expenses: Math.round(expenses),
    });
  }

  return result;
}

/**
 * Get category breakdown for expenses
 */
export async function getCategoryBreakdown(
  userId: string,
  months: number = 3
): Promise<CategoryBreakdown[]> {
  const supabase = await createServerClient();
  const targetDate = subMonths(new Date(), months);

  const { data } = await supabase
    .from('transactions')
    .select(`
      amount,
      category_id,
      categories (
        name
      )
    `)
    .eq('user_id', userId)
    .eq('transaction_type', 'debit')
    .gte('transaction_date', targetDate.toISOString().split('T')[0]);

  if (!data || data.length === 0) {
    return [];
  }

  // Aggregate by category
  const categoryMap = new Map<string, number>();
  let total = 0;

  data.forEach((transaction: any) => {
    const categoryName = transaction.categories?.name || 'Uncategorized';
    const amount = Number(transaction.amount);
    categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + amount);
    total += amount;
  });

  // Convert to array and calculate percentages
  const breakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      percentage: Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 categories

  return breakdown;
}

/**
 * Get tax projection trend for the last 6 months
 */
export async function getTaxProjections(
  userId: string,
  months: number = 6
): Promise<TaxProjection[]> {
  const supabase = await createServerClient();
  const result: TaxProjection[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const targetDate = subMonths(new Date(), i);
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // Get deductible expenses
    const { data: deductibleData } = await supabase
      .from('transactions')
      .select(`
        amount,
        categories (
          tax_treatment
        )
      `)
      .eq('user_id', userId)
      .eq('transaction_type', 'debit')
      .gte('transaction_date', monthStart.toISOString().split('T')[0])
      .lte('transaction_date', monthEnd.toISOString().split('T')[0]);

    // Get income
    const { data: incomeData } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('transaction_type', 'credit')
      .gte('transaction_date', monthStart.toISOString().split('T')[0])
      .lte('transaction_date', monthEnd.toISOString().split('T')[0]);

    const income = incomeData?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const deductibleExpenses = deductibleData
      ?.filter((t: any) => t.categories?.tax_treatment === 'deductible')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // Simple tax calculation: 30% of (income - deductible expenses)
    const taxableIncome = Math.max(0, income - deductibleExpenses);
    const projectedTax = taxableIncome * 0.30;

    // For "actual", we'll use the same for now (in real app, this would come from tax reports)
    result.push({
      month: format(targetDate, 'MMM yyyy'),
      projected: Math.round(projectedTax),
      actual: Math.round(projectedTax * 0.95), // Simulate slight variance
    });
  }

  return result;
}

/**
 * Get compliance health metrics
 */
export async function getComplianceMetrics(
  userId: string
): Promise<ComplianceMetrics> {
  const supabase = await createServerClient();

  // Get all transactions
  const { data: allTransactions } = await supabase
    .from('transactions')
    .select('id, category_id, is_reconciled')
    .eq('user_id', userId);

  if (!allTransactions || allTransactions.length === 0) {
    return {
      categorizedTransactions: 0,
      totalTransactions: 0,
      reconciliationRate: 0,
      taxReadinessScore: 0,
    };
  }

  const totalTransactions = allTransactions.length;
  const categorizedTransactions = allTransactions.filter(t => t.category_id !== null).length;
  const reconciledTransactions = allTransactions.filter(t => t.is_reconciled).length;

  const categorizationRate = (categorizedTransactions / totalTransactions) * 100;
  const reconciliationRate = (reconciledTransactions / totalTransactions) * 100;

  // Tax readiness score: weighted average of categorization and reconciliation
  const taxReadinessScore = Math.round((categorizationRate * 0.6) + (reconciliationRate * 0.4));

  return {
    categorizedTransactions,
    totalTransactions,
    reconciliationRate: Math.round(reconciliationRate),
    taxReadinessScore,
  };
}
