"use client";

import DashboardClient from "@/app/(dashboard)/dashboard/DashboardClient";
import { DashboardShell } from "@/components/layout/dashboard";

const KPI = {
  totalRevenue: 4_850_000,
  totalExpenses: 1_240_000,
  revenueChange: 12,
  estimatedTax: 485_000,
  taxDueDate: "2026-03-31",
  outstandingInvoices: 3,
  pendingCount: 2,
  netProfit: 3_610_000,
  profitChange: 8,
};

const REVENUE = [
  { month: "Jul", revenue: 620_000, expenses: 180_000 },
  { month: "Aug", revenue: 710_000, expenses: 195_000 },
  { month: "Sep", revenue: 840_000, expenses: 210_000 },
  { month: "Oct", revenue: 910_000, expenses: 205_000 },
  { month: "Nov", revenue: 980_000, expenses: 220_000 },
];

const RECENT = [
  {
    id: "t1",
    desc: "GTBank transfer — Ada Ventures",
    amount: 450_000,
    type: "credit",
    date: "2026-11-08",
    relative: "2 days ago",
    status: "reconciled",
  },
  {
    id: "t2",
    desc: "MTN airtime bulk",
    amount: -24_500,
    type: "debit",
    date: "2026-11-07",
    relative: "3 days ago",
    status: "pending",
  },
  {
    id: "t3",
    desc: "Invoice 1042 — Kano Supplies",
    amount: 1_250_000,
    type: "credit",
    date: "2026-11-04",
    relative: "6 days ago",
    status: "reconciled",
  },
];

const SHOT_USER = {
  email: "ada@example.com",
  id: "theme-shot-user",
  role: "user",
};

export default function ThemeShotDashboardPage() {
  return (
    <DashboardShell user={SHOT_USER}>
      <DashboardClient
        userId={SHOT_USER.id}
        accountEmail={SHOT_USER.email}
        kpiData={KPI}
        revenueData={REVENUE}
        recentTransactions={RECENT}
        hasRealBooks
        uncategorizedCount={0}
        duplicatesCount={0}
      />
    </DashboardShell>
  );
}
