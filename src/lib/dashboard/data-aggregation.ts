import { format, subMonths } from "date-fns";
import { api } from "@/lib/convex/http";
import { requireAuthedConvex } from "@/lib/convex/server";

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
 * Get monthly income vs expenses for the last N months (Convex).
 */
export async function getMonthlyIncomeExpenses(
  _userId: string,
  months: number = 6,
): Promise<MonthlyIncomeExpense[]> {
  const { convex } = await requireAuthedConvex();
  const buckets = await convex.query(api.transactions.monthlyTotals, {
    months,
  });
  return buckets.map((bucket) => {
    const [year, month] = bucket.month.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return {
      month: format(date, "MMM yyyy"),
      income: Math.round(bucket.income),
      expenses: Math.round(bucket.expenses),
    };
  });
}

/**
 * Get category breakdown for expenses
 */
export async function getCategoryBreakdown(
  _userId: string,
): Promise<CategoryBreakdown[]> {
  const { convex } = await requireAuthedConvex();
  const { transactions } = await convex.query(api.transactions.listMine, {
    page: 1,
    limit: 500,
    type: "debit",
  });
  const totals = new Map<string, number>();
  let sum = 0;
  for (const txn of transactions) {
    const name = txn.category?.name ?? "Uncategorized";
    const amount = Number(txn.amount);
    totals.set(name, (totals.get(name) ?? 0) + amount);
    sum += amount;
  }
  return [...totals.entries()].map(([name, value]) => ({
    name,
    value: Math.round(value),
    percentage: sum > 0 ? Math.round((value / sum) * 100) : 0,
  }));
}

export async function getTaxProjection(
  _userId: string,
): Promise<TaxProjection[]> {
  const { convex } = await requireAuthedConvex();
  const buckets = await convex.query(api.transactions.monthlyTotals, {
    months: 6,
  });
  return buckets.map((bucket) => {
    const [year, month] = bucket.month.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return {
      month: format(date, "MMM yyyy"),
      projected: Math.round(bucket.income * 0.3),
      actual: 0,
    };
  });
}

export async function getComplianceMetrics(
  _userId: string,
): Promise<ComplianceMetrics> {
  const { convex } = await requireAuthedConvex();
  const { transactions, total } = await convex.query(
    api.transactions.listMine,
    { page: 1, limit: 500 },
  );
  const categorized = transactions.filter((t) => t.category_id).length;
  const reconciled = transactions.filter((t) => t.is_reconciled).length;
  const reconciliationRate = total > 0 ? reconciled / total : 0;
  const categorizedRate = total > 0 ? categorized / total : 0;
  return {
    categorizedTransactions: categorized,
    totalTransactions: total,
    reconciliationRate,
    taxReadinessScore: Math.round(
      (categorizedRate * 0.6 + reconciliationRate * 0.4) * 100,
    ),
  };
}

/** Kept so existing imports of date helpers still typecheck if used. */
export function previousMonthLabel(offset: number): string {
  return format(subMonths(new Date(), offset), "MMM yyyy");
}
