import { api } from "@/lib/convex/http";
import { requireAuthedConvex } from "@/lib/convex/server";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const { convex } = await requireAuthedConvex();
  const currentYear = new Date().getFullYear();
  const totals = await convex.query(api.transactions.totalsForYear, {
    taxYear: currentYear,
  });

  const stats = {
    totalRevenue: totals.income,
    totalExpenses: totals.expenses,
    netIncome: totals.income - totals.expenses,
  };

  return <ReportsClient stats={stats} />;
}
