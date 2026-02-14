import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import DashboardClient from './DashboardClient';

/**
 * KOMPLEET Dashboard - Financial Health Overview
 * Server component: handles auth + data fetching
 */
export default async function DashboardPage() {
  const supabase = await createServerClient();
  await requireServerUser(supabase);

  // Mock data - replace with actual Supabase queries
  const kpiData = {
    totalRevenue: 18800000,
    revenueChange: 12.5,
    estimatedTax: 1000000,
    taxDueDate: 'Mar 21',
    outstandingInvoices: 4200000,
    pendingCount: 8,
    netProfit: 7600000,
    profitChange: 8.3,
  };

  const revenueData = [
    { month: 'Jul', revenue: 1800000, expenses: 1200000 },
    { month: 'Aug', revenue: 2100000, expenses: 1350000 },
    { month: 'Sep', revenue: 1950000, expenses: 1100000 },
    { month: 'Oct', revenue: 2400000, expenses: 1500000 },
    { month: 'Nov', revenue: 2800000, expenses: 1600000 },
    { month: 'Dec', revenue: 3200000, expenses: 1800000 },
    { month: 'Jan', revenue: 2600000, expenses: 1400000 },
    { month: 'Feb', revenue: 2900000, expenses: 1550000 },
  ];

  const taxBreakdown = [
    { name: 'VAT', value: 425000, color: '#166534' },
    { name: 'WHT', value: 180000, color: '#22c55e' },
    { name: 'CIT', value: 320000, color: '#86efac' },
    { name: 'Stamp Duty', value: 75000, color: '#bbf7d0' },
  ];

  const recentTransactions = [
    { id: 'TXN-001', desc: 'Payment from Dangote Industries', amount: 2500000, type: 'credit', date: 'Feb 14, 2026', status: 'completed' },
    { id: 'TXN-002', desc: 'Office rent - Victoria Island', amount: -850000, type: 'debit', date: 'Feb 13, 2026', status: 'completed' },
    { id: 'TXN-003', desc: 'Invoice #INV-045 - TechCorp', amount: 1200000, type: 'credit', date: 'Feb 12, 2026', status: 'pending' },
    { id: 'TXN-004', desc: 'FIRS VAT Payment Q4', amount: -425000, type: 'debit', date: 'Feb 11, 2026', status: 'completed' },
    { id: 'TXN-005', desc: 'Payment from MTN Nigeria', amount: 3800000, type: 'credit', date: 'Feb 10, 2026', status: 'completed' },
  ];

  return (
    <DashboardClient
      kpiData={kpiData}
      revenueData={revenueData}
      taxBreakdown={taxBreakdown}
      recentTransactions={recentTransactions}
    />
  );
}
