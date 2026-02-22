/**
 * Balance Validator
 * Ensures transaction data integrity through balance validation
 */

import { NormalizedTransaction } from "./normalizer";

export interface BalanceValidationResult {
  valid: boolean;
  errors: BalanceError[];
  warnings: BalanceWarning[];
  openingBalance: number;
  closingBalance: number;
  calculatedClosingBalance: number;
  discrepancy: number;
}

export interface BalanceError {
  transactionIndex: number;
  date: string;
  merchant: string;
  errorType: "BALANCE_MISMATCH" | "NEGATIVE_BALANCE" | "INVALID_CALCULATION";
  message: string;
  expected: number;
  actual: number;
}

export interface BalanceWarning {
  transactionIndex: number;
  date: string;
  merchant: string;
  warningType: "LARGE_DISCREPANCY" | "UNUSUAL_BALANCE" | "NEGATIVE_BALANCE";
  message: string;
}

const TOLERANCE = 0.01; // ₦0.01 tolerance for rounding errors

/**
 * Validate transaction balances
 */
export function validateBalances(
  transactions: NormalizedTransaction[],
): BalanceValidationResult {
  const errors: BalanceError[] = [];
  const warnings: BalanceWarning[] = [];

  if (transactions.length === 0) {
    return {
      valid: false,
      errors: [
        {
          transactionIndex: 0,
          date: "",
          merchant: "",
          errorType: "INVALID_CALCULATION",
          message: "No transactions to validate",
          expected: 0,
          actual: 0,
        },
      ],
      warnings: [],
      openingBalance: 0,
      closingBalance: 0,
      calculatedClosingBalance: 0,
      discrepancy: 0,
    };
  }

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Get opening balance from first transaction
  const openingBalance = sortedTransactions[0].balance;
  let runningBalance = openingBalance;

  // Validate each transaction
  sortedTransactions.forEach((transaction, index) => {
    // Calculate expected balance
    if (transaction.type === "credit") {
      runningBalance += transaction.amount;
    } else {
      runningBalance -= transaction.amount;
    }

    // Check if calculated balance matches reported balance
    const discrepancy = Math.abs(runningBalance - transaction.balance);

    if (discrepancy > TOLERANCE) {
      errors.push({
        transactionIndex: index,
        date: transaction.date,
        merchant: transaction.merchant,
        errorType: "BALANCE_MISMATCH",
        message: `Balance mismatch: expected ₦${runningBalance.toFixed(2)}, got ₦${transaction.balance.toFixed(2)}`,
        expected: runningBalance,
        actual: transaction.balance,
      });

      // Use reported balance for next calculation to avoid cascading errors
      runningBalance = transaction.balance;
    }

    // Check for negative balance
    if (transaction.balance < 0) {
      warnings.push({
        transactionIndex: index,
        date: transaction.date,
        merchant: transaction.merchant,
        warningType: "NEGATIVE_BALANCE",
        message: `Negative balance: ₦${transaction.balance.toFixed(2)}`,
      });
    }

    // Check for large balance changes (> ₦1,000,000)
    if (index > 0) {
      const previousBalance = sortedTransactions[index - 1].balance;
      const balanceChange = Math.abs(transaction.balance - previousBalance);

      if (balanceChange > 1000000) {
        warnings.push({
          transactionIndex: index,
          date: transaction.date,
          merchant: transaction.merchant,
          warningType: "LARGE_DISCREPANCY",
          message: `Large balance change: ₦${balanceChange.toFixed(2)}`,
        });
      }
    }
  });

  const closingBalance =
    sortedTransactions[sortedTransactions.length - 1].balance;
  const calculatedClosingBalance = runningBalance;
  const finalDiscrepancy = Math.abs(closingBalance - calculatedClosingBalance);

  return {
    valid: errors.length === 0 && finalDiscrepancy <= TOLERANCE,
    errors,
    warnings,
    openingBalance,
    closingBalance,
    calculatedClosingBalance,
    discrepancy: finalDiscrepancy,
  };
}

/**
 * Calculate running balance for transactions
 */
export function calculateRunningBalance(
  transactions: NormalizedTransaction[],
  startingBalance: number,
): NormalizedTransaction[] {
  let balance = startingBalance;

  return transactions.map((transaction) => {
    if (transaction.type === "credit") {
      balance += transaction.amount;
    } else {
      balance -= transaction.amount;
    }

    return {
      ...transaction,
      balance,
    };
  });
}

/**
 * Get balance summary
 */
export function getBalanceSummary(transactions: NormalizedTransaction[]): {
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  netChange: number;
} {
  if (transactions.length === 0) {
    return {
      openingBalance: 0,
      closingBalance: 0,
      totalCredits: 0,
      totalDebits: 0,
      netChange: 0,
    };
  }

  const sortedTransactions = [...transactions].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const openingBalance = sortedTransactions[0].balance;
  const closingBalance =
    sortedTransactions[sortedTransactions.length - 1].balance;

  const totalCredits = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const netChange = totalCredits - totalDebits;

  return {
    openingBalance,
    closingBalance,
    totalCredits,
    totalDebits,
    netChange,
  };
}
