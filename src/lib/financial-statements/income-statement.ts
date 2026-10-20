/**
 * Income Statement (P&L) Generator
 * Generates Profit & Loss statements from transaction data
 */

import {
  AMOUNT_NGN_HEADER,
  exportHtmlChrome,
} from "@/lib/export-chrome";

export interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "debit" | "credit";
  category_id?: string;
  category?: {
    name: string;
    type: "income" | "expense" | "asset" | "liability";
  };
}

export interface IncomeStatementData {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    total: number;
    breakdown: Record<string, number>;
  };
  expenses: {
    total: number;
    breakdown: Record<string, number>;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

/**
 * Generate Income Statement from transactions
 */
export function generateIncomeStatement(
  transactions: Transaction[],
  startDate: string,
  endDate: string,
): IncomeStatementData {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const filtered = transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d >= start && d <= end;
  });

  const revenueBreakdown: Record<string, number> = {};
  const expenseBreakdown: Record<string, number> = {};

  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const t of filtered) {
    const amount = Math.abs(t.amount);
    const categoryName = t.category?.name ?? "Uncategorized";

    const isIncome =
      t.category?.type === "income" || t.transaction_type === "credit";

    const isExpense =
      t.category?.type === "expense" || t.transaction_type === "debit";

    if (isIncome) {
      revenueBreakdown[categoryName] =
        (revenueBreakdown[categoryName] || 0) + amount;
      totalRevenue += amount;
    }

    if (isExpense) {
      expenseBreakdown[categoryName] =
        (expenseBreakdown[categoryName] || 0) + amount;
      totalExpenses += amount;
    }
  }

  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin =
    totalRevenue > 0
      ? Number(((grossProfit / totalRevenue) * 100).toFixed(2))
      : 0;

  return {
    period: { startDate, endDate },
    revenue: {
      total: Number(totalRevenue.toFixed(2)),
      breakdown: revenueBreakdown,
    },
    expenses: {
      total: Number(totalExpenses.toFixed(2)),
      breakdown: expenseBreakdown,
    },
    grossProfit: Number(grossProfit.toFixed(2)),
    netProfit: Number(grossProfit.toFixed(2)),
    profitMargin,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `NGN ${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generate Income Statement as HTML
 */
export function generateIncomeStatementHTML(data: IncomeStatementData): string {
  const { period, revenue, expenses, grossProfit, netProfit, profitMargin } =
    data;

  return exportHtmlChrome({
    title: "Income Statement",
    body: `
  <h1>Income Statement</h1>
  <p style="text-align:center;">
    Period: ${new Date(period.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
    to ${new Date(period.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
  </p>
  <h2>Revenue</h2>
  <table>
    <tr><th>Description</th><th class="amount">${AMOUNT_NGN_HEADER}</th></tr>
    ${Object.entries(revenue.breakdown)
      .map(([k, v]) => `<tr><td>${k}</td><td class="amount">${formatCurrency(v)}</td></tr>`)
      .join("")}
    <tr><td>Total revenue</td><td class="amount">${formatCurrency(revenue.total)}</td></tr>
  </table>
  <h2>Expenses</h2>
  <table>
    <tr><th>Description</th><th class="amount">${AMOUNT_NGN_HEADER}</th></tr>
    ${Object.entries(expenses.breakdown)
      .map(([k, v]) => `<tr><td>${k}</td><td class="amount">${formatCurrency(v)}</td></tr>`)
      .join("")}
    <tr><td>Total expenses</td><td class="amount">${formatCurrency(expenses.total)}</td></tr>
  </table>
  <table>
    <tr><td>Gross Profit</td><td class="amount">${formatCurrency(grossProfit)}</td></tr>
    <tr><td>Net Profit</td><td class="amount">${formatCurrency(netProfit)}</td></tr>
    <tr><td>Profit Margin</td><td class="amount">${profitMargin}%</td></tr>
  </table>`,
  });
}
