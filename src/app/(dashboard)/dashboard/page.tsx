import { requireServerUser } from "@/lib/supabase/session";
import { createServerClient } from "@/lib/supabase/server";
import { getMonthlyIncomeExpenses } from "@/lib/dashboard/data-aggregation";
import { api } from "@/lib/convex/http";
import { requireAuthedConvex } from "@/lib/convex/server";
import DashboardClient from "./DashboardClient";

const TAX_COLORS: Record<string, string> = {
  vat: "#166534",
  wht: "#22c55e",
  cit: "#86efac",
  pit: "#bbf7d0",
};
const TAX_LABELS: Record<string, string> = {
  vat: "VAT",
  wht: "WHT",
  cit: "CIT",
  pit: "PIT",
};

/**
 * KOMPLEET Dashboard - Financial Health Overview
 * Server component: auth via Supabase; app data via Convex.
 */
export default async function DashboardPage() {
  const supabase = await createServerClient();
  const user = await requireServerUser(supabase);
  const { convex } = await requireAuthedConvex();

  const currentYear = new Date().getFullYear();

  const [thisYear, lastYear, monthlyData, invoices, taxCalcs] =
    await Promise.all([
      convex.query(api.transactions.totalsForYear, { taxYear: currentYear }),
      convex.query(api.transactions.totalsForYear, {
        taxYear: currentYear - 1,
      }),
      getMonthlyIncomeExpenses(user.id, 8),
      convex.query(api.invoices.listMine, { status: "sent" }),
      convex.query(api.tax.listCalculations, {}),
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

  const taxMap = new Map<string, number>();
  for (const t of taxCalcs) {
    if (t.tax_year !== currentYear || !t.is_final) continue;
    taxMap.set(
      t.tax_type,
      (taxMap.get(t.tax_type) ?? 0) + Number(t.tax_due),
    );
  }

  const taxBreakdown = Array.from(taxMap.entries()).map(([type, value]) => ({
    name: TAX_LABELS[type] || type.toUpperCase(),
    value: Math.round(value),
    color: TAX_COLORS[type] || "#94a3b8",
  }));

  const estimatedTax =
    taxBreakdown.reduce((sum, t) => sum + t.value, 0) ||
    Math.round(totalIncome * 0.3);

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

  const revenueData = monthlyData.map((item) => ({
    month: item.month.split(" ")[0],
    revenue: item.income,
    expenses: item.expenses,
  }));

  const recent = await convex.query(api.transactions.listMine, {
    page: 1,
    limit: 5,
  });

  const recentTransactions = recent.transactions.map((t) => ({
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
    status: t.is_reconciled ? "completed" : "pending",
  }));

  return (
    <DashboardClient
      kpiData={kpiData}
      revenueData={revenueData}
      taxBreakdown={
        taxBreakdown.length > 0
          ? taxBreakdown
          : [{ name: "Estimated", value: estimatedTax, color: "#166534" }]
      }
      recentTransactions={recentTransactions}
    />
  );
}
