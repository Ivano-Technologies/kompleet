import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import { getTransactionTotals } from '@/lib/supabase/queries';
import YoYClient from './YoYClient';

export default async function YoYComparisonPage() {
  const supabase = await createServerClient();
  await requireServerUser(supabase);

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const [currentResult, previousResult] = await Promise.all([
    getTransactionTotals(supabase as any, currentYear),
    getTransactionTotals(supabase as any, previousYear),
  ]);

  const data = {
    currentYear: {
      year: currentYear,
      revenue: currentResult.data?.income ?? 0,
      expenses: currentResult.data?.expenses ?? 0,
      profit: (currentResult.data?.income ?? 0) - (currentResult.data?.expenses ?? 0),
    },
    previousYear: {
      year: previousYear,
      revenue: previousResult.data?.income ?? 0,
      expenses: previousResult.data?.expenses ?? 0,
      profit: (previousResult.data?.income ?? 0) - (previousResult.data?.expenses ?? 0),
    },
  };

  return <YoYClient data={data} />;
}
