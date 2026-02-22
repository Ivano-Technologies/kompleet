/**
 * Financial Statements Service
 * Generates P&L and Balance Sheet from transactions
 * Follows Nigerian accounting standards
 */

interface Transaction {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "debit" | "credit";
  category?: {
    id: string;
    name: string;
    category_type: string;
    tax_treatment: string;
  };
}

interface ProfitLossStatement {
  period: {
    start: string;
    end: string;
  };
  revenue: {
    items: LineItem[];
    total: number;
  };
  expenses: {
    items: LineItem[];
    total: number;
  };
  netIncome: number;
  taxableIncome: number;
}

interface BalanceSheet {
  period: {
    asOf: string;
  };
  assets: {
    current: { items: LineItem[]; total: number };
    nonCurrent: { items: LineItem[]; total: number };
    total: number;
  };
  liabilities: {
    current: { items: LineItem[]; total: number };
    nonCurrent: { items: LineItem[]; total: number };
    total: number;
  };
  equity: {
    items: LineItem[];
    total: number;
  };
  totalLiabilitiesAndEquity: number;
}

interface LineItem {
  category: string;
  amount: number;
  count: number;
  taxTreatment?: string;
}

export class FinancialStatementsService {
  /**
   * Generate Profit & Loss Statement
   */
  static generateProfitLoss(
    transactions: Transaction[],
    startDate: string,
    endDate: string,
  ): ProfitLossStatement {
    // Filter transactions by date range
    const filtered = transactions.filter((t) => {
      const date = new Date(t.transaction_date);
      return date >= new Date(startDate) && date <= new Date(endDate);
    });

    // Separate revenue and expenses
    const revenueTransactions = filtered.filter(
      (t) => t.category?.category_type === "income",
    );
    const expenseTransactions = filtered.filter(
      (t) => t.category?.category_type === "expense",
    );

    // Group by category
    const revenueItems = this.groupByCategory(revenueTransactions);
    const expenseItems = this.groupByCategory(expenseTransactions);

    // Calculate totals
    const totalRevenue = revenueItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const totalExpenses = expenseItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const netIncome = totalRevenue - totalExpenses;

    // Calculate taxable income (exclude non-deductible expenses)
    const deductibleExpenses = expenseItems
      .filter((item) => item.taxTreatment !== "non_deductible")
      .reduce((sum, item) => sum + item.amount, 0);
    const taxableIncome = totalRevenue - deductibleExpenses;

    return {
      period: { start: startDate, end: endDate },
      revenue: { items: revenueItems, total: totalRevenue },
      expenses: { items: expenseItems, total: totalExpenses },
      netIncome,
      taxableIncome,
    };
  }

  /**
   * Generate Balance Sheet
   */
  static generateBalanceSheet(
    transactions: Transaction[],
    asOfDate: string,
  ): BalanceSheet {
    // Filter transactions up to the specified date
    const filtered = transactions.filter((t) => {
      const date = new Date(t.transaction_date);
      return date <= new Date(asOfDate);
    });

    // Separate by category type
    const assetTransactions = filtered.filter(
      (t) => t.category?.category_type === "asset",
    );
    const liabilityTransactions = filtered.filter(
      (t) => t.category?.category_type === "liability",
    );

    // Group assets (current vs non-current based on common categories)
    const currentAssetCategories = [
      "Cash",
      "Bank Account",
      "Accounts Receivable",
      "Inventory",
    ];
    const currentAssets = assetTransactions.filter((t) =>
      currentAssetCategories.includes(t.category?.name || ""),
    );
    const nonCurrentAssets = assetTransactions.filter(
      (t) => !currentAssetCategories.includes(t.category?.name || ""),
    );

    // Group liabilities (current vs non-current)
    const currentLiabilityCategories = [
      "Accounts Payable",
      "Short-term Loan",
      "Accrued Expenses",
    ];
    const currentLiabilities = liabilityTransactions.filter((t) =>
      currentLiabilityCategories.includes(t.category?.name || ""),
    );
    const nonCurrentLiabilities = liabilityTransactions.filter(
      (t) => !currentLiabilityCategories.includes(t.category?.name || ""),
    );

    // Group by category
    const currentAssetItems = this.groupByCategory(currentAssets);
    const nonCurrentAssetItems = this.groupByCategory(nonCurrentAssets);
    const currentLiabilityItems = this.groupByCategory(currentLiabilities);
    const nonCurrentLiabilityItems = this.groupByCategory(
      nonCurrentLiabilities,
    );

    // Calculate totals
    const totalCurrentAssets = currentAssetItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const totalNonCurrentAssets = nonCurrentAssetItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

    const totalCurrentLiabilities = currentLiabilityItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const totalNonCurrentLiabilities = nonCurrentLiabilityItems.reduce(
      (sum, item) => sum + item.amount,
      0,
    );
    const totalLiabilities =
      totalCurrentLiabilities + totalNonCurrentLiabilities;

    // Calculate equity (Assets - Liabilities)
    const equity = totalAssets - totalLiabilities;
    const equityItems: LineItem[] = [
      { category: "Owner's Equity", amount: equity, count: 1 },
    ];

    return {
      period: { asOf: asOfDate },
      assets: {
        current: { items: currentAssetItems, total: totalCurrentAssets },
        nonCurrent: {
          items: nonCurrentAssetItems,
          total: totalNonCurrentAssets,
        },
        total: totalAssets,
      },
      liabilities: {
        current: {
          items: currentLiabilityItems,
          total: totalCurrentLiabilities,
        },
        nonCurrent: {
          items: nonCurrentLiabilityItems,
          total: totalNonCurrentLiabilities,
        },
        total: totalLiabilities,
      },
      equity: {
        items: equityItems,
        total: equity,
      },
      totalLiabilitiesAndEquity: totalLiabilities + equity,
    };
  }

  /**
   * Group transactions by category
   */
  private static groupByCategory(transactions: Transaction[]): LineItem[] {
    const grouped = new Map<string, LineItem>();

    transactions.forEach((t) => {
      const categoryName = t.category?.name || "Uncategorized";
      const existing = grouped.get(categoryName);

      if (existing) {
        existing.amount += t.amount;
        existing.count += 1;
      } else {
        grouped.set(categoryName, {
          category: categoryName,
          amount: t.amount,
          count: 1,
          taxTreatment: t.category?.tax_treatment,
        });
      }
    });

    // Sort by amount (descending)
    return Array.from(grouped.values()).sort((a, b) => b.amount - a.amount);
  }

  /**
   * Format currency for Nigerian Naira
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Calculate key financial ratios
   */
  static calculateRatios(pl: ProfitLossStatement, bs: BalanceSheet) {
    return {
      profitMargin:
        pl.revenue.total > 0 ? (pl.netIncome / pl.revenue.total) * 100 : 0,
      currentRatio:
        bs.liabilities.current.total > 0
          ? bs.assets.current.total / bs.liabilities.current.total
          : 0,
      debtToEquity:
        bs.equity.total > 0 ? bs.liabilities.total / bs.equity.total : 0,
      returnOnAssets:
        bs.assets.total > 0 ? (pl.netIncome / bs.assets.total) * 100 : 0,
    };
  }
}
