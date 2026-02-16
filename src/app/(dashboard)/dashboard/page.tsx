import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import { getDashboardSummary, getTransactionTotals } from '@/lib/supabase/queries';
import { getMonthlyIncomeExpenses } from '@/lib/dashboard/data-aggregation';
import DashboardClient from './DashboardClient';

const TAX_COLORS: Record<string, string> = {
  vat: '#166534', wht: '#22c55e', cit: '#86efac', pit: '#bbf7d0',
};
const TAX_LABELS: Record<string, string> = {
  vat: 'VAT', wht: 'WHT', cit: 'CIT', pit: 'PIT',
};

/**
 * KOMPLEET Dashboard - Financial Health Overview
 * Server component: handles auth + data fetching
 */
export default async function DashboardPage() {
  const supabase = await createServerClient();
  const user = await requireServerUser(supabase);

  const currentYear = new Date().getFullYear();

  // Fetch real data in parallel (including previous year for YoY comparison)
  const [summaryResult, monthlyData, prevYearResult] = await Promise.all([
    getDashboardSummary(supabase as any, currentYear),
    getMonthlyIncomeExpenses(user.id, 8),
    getTransactionTotals(supabase as any, currentYear - 1),
  ]);

  const summary = summaryResult.data;
  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;

  // Calculate YoY percentage changes
  const prevIncome = prevYearResult.data?.income ?? 0;
  const prevExpenses = prevYearResult.data?.expenses ?? 0;
  const prevProfit = prevIncome - prevExpenses;
  const currentProfit = totalIncome - totalExpenses;

  const revenueChange = prevIncome > 0
    ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100)
    : 0;
  const profitChange = prevProfit > 0
    ? Math.round(((currentProfit - prevProfit) / prevProfit) * 100)
    : 0;

  // Calculate next tax due date (Nigerian tax calendar: VAT due 21st of following month)
  const now = new Date();
  const nextVATDue = new Date(now.getFullYear(), now.getMonth() + 1, 21);
  if (nextVATDue <= now) {
    nextVATDue.setMonth(nextVATDue.getMonth() + 1);
  }
  const taxDueDate = nextVATDue.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });

  // Query outstanding invoices (safe — returns null if table missing)
  const { data: invoiceData } = await supabase
    .from('invoices')
    .select('amount_due')
    .eq('user_id', user.id)
    .eq('status', 'sent');

  const outstandingInvoices = invoiceData?.reduce((sum: number, inv: any) => sum + Number(inv.amount_due), 0) ?? 0;
  const pendingCount = invoiceData?.length ?? 0;

  // Tax breakdown from tax_calculations
  const { data: taxData } = await supabase
    .from('tax_calculations')
    .select('tax_type, tax_due')
    .eq('user_id', user.id)
    .eq('tax_year', currentYear)
    .eq('is_final', true);

  const taxMap = new Map<string, number>();
  (taxData ?? []).forEach((t: any) => {
    taxMap.set(t.tax_type, (taxMap.get(t.tax_type) ?? 0) + Number(t.tax_due));
  });

  const taxBreakdown = Array.from(taxMap.entries()).map(([type, value]) => ({
    name: TAX_LABELS[type] || type.toUpperCase(),
    value: Math.round(value),
    color: TAX_COLORS[type] || '#94a3b8',
  }));

  const estimatedTax = taxBreakdown.reduce((sum, t) => sum + t.value, 0)
    || Math.round(totalIncome * 0.30);

  const kpiData = {
    totalRevenue: Math.round(totalIncome),
    revenueChange,
    estimatedTax,
    taxDueDate,
    outstandingInvoices: Math.round(outstandingInvoices),
    pendingCount,
    netProfit: Math.round(currentProfit),
    profitChange,
  };

  const revenueData = monthlyData.map(item => ({
    month: item.month.split(' ')[0],
    revenue: item.income,
    expenses: item.expenses,
  }));

  const recentTransactions = (summary?.recentTransactions ?? []).map((t: any) => ({
    id: t.id,
    desc: t.description,
    amount: t.transaction_type === 'credit' ? Number(t.amount) : -Number(t.amount),
    type: t.transaction_type,
    date: new Date(t.transaction_date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }),
    status: t.is_verified ? 'completed' : 'pending',
  }));

  return (
    <DashboardClient
      kpiData={kpiData}
      revenueData={revenueData}
      taxBreakdown={taxBreakdown.length > 0
        ? taxBreakdown
        : [{ name: 'Estimated', value: estimatedTax, color: '#166534' }]}
      recentTransactions={recentTransactions}
    />
  );
}
