/**
 * Income Statement (P&L) Generator
 * Generates Profit & Loss statements from transaction data
 */

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
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generate Income Statement as HTML
 */
export function generateIncomeStatementHTML(data: IncomeStatementData): string {
  const { period, revenue, expenses, grossProfit, netProfit, profitMargin } =
    data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Income Statement</title>
</head>
<body>
  <h1>Income Statement (Profit & Loss)</h1>
  <p>
    Period: ${new Date(period.startDate).toLocaleDateString("en-NG")} 
    to ${new Date(period.endDate).toLocaleDateString("en-NG")}
  </p>

  <h2>Revenue</h2>
  <ul>
    ${Object.entries(revenue.breakdown)
      .map(([k, v]) => `<li>${k}: ${formatCurrency(v)}</li>`)
      .join("")}
  </ul>

  <h2>Expenses</h2>
  <ul>
    ${Object.entries(expenses.breakdown)
      .map(([k, v]) => `<li>${k}: ${formatCurrency(v)}</li>`)
      .join("")}
  </ul>

  <h3>Gross Profit: ${formatCurrency(grossProfit)}</h3>
  <h3>Net Profit: ${formatCurrency(netProfit)}</h3>
  <p>Profit Margin: ${profitMargin}%</p>
</body>
</html>
  `;
}
