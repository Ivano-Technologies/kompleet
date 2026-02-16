import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import { getTransactionTotals } from '@/lib/supabase/queries';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
  const supabase = await createServerClient();
  await requireServerUser(supabase);

  const currentYear = new Date().getFullYear();
  const totalsResult = await getTransactionTotals(supabase as any, currentYear);

  const stats = {
    totalRevenue: totalsResult.data?.income ?? 0,
    totalExpenses: totalsResult.data?.expenses ?? 0,
    netIncome: (totalsResult.data?.income ?? 0) - (totalsResult.data?.expenses ?? 0),
  };

  return <ReportsClient stats={stats} />;
}
