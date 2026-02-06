/**
 * Income Statement (P&L) Generator
 * Generates Profit & Loss statements from transaction data
 */

export interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: 'debit' | 'credit';
  category_id?: string;
  category?: {
    name: string;
    type: 'income' | 'expense' | 'asset' | 'liability';
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
  endDate: string
): IncomeStatementData {
  // Filter transactions by date range
  const filteredTransactions = transactions.filter((t) => {
    const date = t.transaction_date;
    return date >= startDate && date <= endDate;
  });

  // Separate income and expenses
  const incomeTransactions = filteredTransactions.filter(
    (t) => t.category?.type === 'income' || (t.transaction_type === 'credit' && !t.category)
  );

  const expenseTransactions = filteredTransactions.filter(
    (t) => t.category?.type === 'expense' || (t.transaction_type === 'debit' && !t.category)
  );

  // Calculate revenue breakdown
  const revenueBreakdown: Record<string, number> = {};
  let totalRevenue = 0;

  incomeTransactions.forEach((t) => {
    const category = t.category?.name || 'Uncategorized Income';
    revenueBreakdown[category] = (revenueBreakdown[category] || 0) + t.amount;
    totalRevenue += t.amount;
  });

  // Calculate expense breakdown
  const expenseBreakdown: Record<string, number> = {};
  let totalExpenses = 0;

  expenseTransactions.forEach((t) => {
    const category = t.category?.name || 'Uncategorized Expense';
    expenseBreakdown[category] = (expenseBreakdown[category] || 0) + t.amount;
    totalExpenses += t.amount;
  });

  // Calculate profit metrics
  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return {
    period: {
      startDate,
      endDate,
    },
    revenue: {
      total: totalRevenue,
      breakdown: revenueBreakdown,
    },
    expenses: {
      total: totalExpenses,
      breakdown: expenseBreakdown,
    },
    grossProfit,
    netProfit: grossProfit, // Simplified: same as gross profit for now
    profitMargin,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Generate Income Statement as HTML
 */
export function generateIncomeStatementHTML(data: IncomeStatementData): string {
  const { period, revenue, expenses, grossProfit, netProfit, profitMargin } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Income Statement</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      text-align: center;
      color: #1a5f3a;
    }
    .period {
      text-align: center;
      margin-bottom: 30px;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .amount {
      text-align: right;
    }
    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }
    .profit-row {
      font-weight: bold;
      font-size: 1.1em;
      background-color: #e8f5e9;
    }
    .section-header {
      background-color: #1a5f3a;
      color: white;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Income Statement (Profit & Loss)</h1>
  <div class="period">
    Period: ${new Date(period.startDate).toLocaleDateString('en-NG')} to ${new Date(period.endDate).toLocaleDateString('en-NG')}
  </div>

  <table>
    <tr class="section-header">
      <th>REVENUE</th>
      <th class="amount">Amount (₦)</th>
    </tr>
    ${Object.entries(revenue.breakdown)
      .map(
        ([category, amount]) => `
      <tr>
        <td>${category}</td>
        <td class="amount">${formatCurrency(amount)}</td>
      </tr>
    `
      )
      .join('')}
    <tr class="total-row">
      <td>Total Revenue</td>
      <td class="amount">${formatCurrency(revenue.total)}</td>
    </tr>
  </table>

  <table>
    <tr class="section-header">
      <th>EXPENSES</th>
      <th class="amount">Amount (₦)</th>
    </tr>
    ${Object.entries(expenses.breakdown)
      .map(
        ([category, amount]) => `
      <tr>
        <td>${category}</td>
        <td class="amount">${formatCurrency(amount)}</td>
      </tr>
    `
      )
      .join('')}
    <tr class="total-row">
      <td>Total Expenses</td>
      <td class="amount">${formatCurrency(expenses.total)}</td>
    </tr>
  </table>

  <table>
    <tr class="profit-row">
      <td>Gross Profit</td>
      <td class="amount">${formatCurrency(grossProfit)}</td>
    </tr>
    <tr class="profit-row">
      <td>Net Profit</td>
      <td class="amount">${formatCurrency(netProfit)}</td>
    </tr>
    <tr>
      <td>Profit Margin</td>
      <td class="amount">${profitMargin.toFixed(2)}%</td>
    </tr>
  </table>

  <div style="margin-top: 40px; text-align: center; color: #666; font-size: 0.9em;">
    <p>Generated by KOMPLEET Platform</p>
    <p>Kompleet records. Kompleet filings. Kompleet compliance.</p>
  </div>
</body>
</html>
  `;
}
