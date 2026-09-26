import { requireAuth } from "@/lib/auth";
import { getMonthlyIncomeExpenses } from "@/lib/dashboard/data-aggregation";
import { api } from "@/lib/convex/http";
import { requireAuthedConvex } from "@/lib/convex/server";
import DashboardClient from "./DashboardClient";

function relativeDay(isoDate: string): string {
  const value = new Date(isoDate);
  const today = new Date();
  const startToday = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startValue = Date.UTC(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
  const diff = Math.round((startToday - startValue) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  return value.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function isUncategorized(txn: {
  category: { id: string } | null;
  confidence_score: number | null;
}): boolean {
  if (!txn.category) return true;
  return typeof txn.confidence_score === "number" && txn.confidence_score < 80;
}

/**
 * KOMPLEET Dashboard - Financial Health Overview
 * Server component: auth via Convex Auth; app data via Convex.
 */
export default async function DashboardPage() {
  const user = await requireAuth();
  const { convex } = await requireAuthedConvex();

  const currentYear = new Date().getFullYear();

  const [thisYear, lastYear, monthlyData, invoices, booksPage] =
    await Promise.all([
      convex.query(api.transactions.totalsForYear, { taxYear: currentYear }),
      convex.query(api.transactions.totalsForYear, {
        taxYear: currentYear - 1,
      }),
      getMonthlyIncomeExpenses(user.id, 8),
      convex.query(api.invoices.listMine, { status: "sent" }),
      convex.query(api.transactions.listMine, { page: 1, limit: 100 }),
    ]);

  const totalIncome = thisYear.income;
  const totalExpenses = thisYear.expenses;

  const prevIncome = lastYear.income;
  const prevExpenses = lastYear.expenses;
  const prevProfit = prevIncome - prevExpenses;
  const currentProfit = totalIncome - totalExpenses;

  const revenueChange =
    prevIncome > 0
      ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100)
      : 0;
  const profitChange =
    prevProfit > 0
      ? Math.round(((currentProfit - prevProfit) / prevProfit) * 100)
      : 0;

  const now = new Date();
  const nextVATDue = new Date(now.getFullYear(), now.getMonth() + 1, 21);
  if (nextVATDue <= now) {
    nextVATDue.setMonth(nextVATDue.getMonth() + 1);
  }
  const taxDueDate = nextVATDue.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
  });

  const outstandingInvoices =
    invoices.reduce((sum, inv) => sum + Number(inv.amount_due ?? 0), 0) ?? 0;
  const pendingCount = invoices.length;

  const estimatedTax = Math.round(totalIncome * 0.3);

  const kpiData = {
    totalRevenue: Math.round(totalIncome),
    totalExpenses: Math.round(totalExpenses),
    revenueChange,
    estimatedTax,
    taxDueDate,
    outstandingInvoices: Math.round(outstandingInvoices),
    pendingCount,
    netProfit: Math.round(currentProfit),
    profitChange,
  };

  const revenueData = monthlyData.map((item) => ({
    month: item.month.split(" ")[0],
    revenue: item.income,
    expenses: item.expenses,
  }));

  const recentTransactions = booksPage.transactions.slice(0, 5).map((t) => ({
    id: t.id,
    desc: t.description,
    amount:
      t.transaction_type === "credit" ? Number(t.amount) : -Number(t.amount),
    type: t.transaction_type,
    date: new Date(t.transaction_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    relative: relativeDay(t.transaction_date),
    status: t.is_reconciled ? "completed" : "pending",
  }));

  const uncategorizedCount = booksPage.transactions.filter(isUncategorized).length;

  return (
    <DashboardClient
      kpiData={kpiData}
      revenueData={revenueData}
      recentTransactions={recentTransactions}
      hasBooks={booksPage.total > 0}
      uncategorizedCount={uncategorizedCount}
      duplicatesCount={0}
    />
  );
}
