/**
 * Transaction validation module
 * Validates transactions before persistence
 */

import { Transaction, ParseError } from "./types";

/**
 * Validation rules
 */
export interface ValidationRules {
  minDate?: Date;
  maxDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  allowedCurrencies?: string[];
  allowedTypes?: ("debit" | "credit")[];
}

/**
 * Validate transactions
 */
export function validateTransactions(
  transactions: Transaction[],
  rules?: ValidationRules,
): { valid: Transaction[]; errors: ParseError[] } {
  const valid: Transaction[] = [];
  const errors: ParseError[] = [];

  const defaultRules: ValidationRules = {
    minDate: new Date("2000-01-01"),
    maxDate: new Date(),
    minAmount: 0.01,
    maxAmount: 1_000_000_000, // 1 billion
    allowedCurrencies: ["NGN", "USD", "EUR", "GBP"],
    allowedTypes: ["debit", "credit"],
    ...rules,
  };

  transactions.forEach((tx, index) => {
    const validationErrors = validateTransaction(tx, defaultRules);

    if (validationErrors.length === 0) {
      valid.push(tx);
    } else {
      for (const error of validationErrors) {
        errors.push({
          rowNumber: index + 1,
          errorType: error.type,
          errorMessage: error.message,
          rawData: tx.raw_data,
        });
      }
    }
  });

  return { valid, errors };
}

/**
 * Validate a single transaction
 */
export function validateTransaction(
  transaction: Transaction,
  rules: ValidationRules,
): Array<{ type: string; message: string }> {
  const errors: Array<{ type: string; message: string }> = [];

  // Validate date
  if (!transaction.date) {
    errors.push({ type: "MISSING_DATE", message: "Date is required" });
  } else {
    const date = new Date(transaction.date);
    if (isNaN(date.getTime())) {
      errors.push({
        type: "INVALID_DATE",
        message: `Invalid date: ${transaction.date}`,
      });
    } else {
      if (rules.minDate && date < rules.minDate) {
        errors.push({
          type: "DATE_OUT_OF_RANGE",
          message: `Date ${transaction.date} is before minimum date ${rules.minDate?.toISOString().split("T")[0]}`,
        });
      }
      if (rules.maxDate && date > rules.maxDate) {
        errors.push({
          type: "DATE_OUT_OF_RANGE",
          message: `Date ${transaction.date} is after maximum date ${rules.maxDate?.toISOString().split("T")[0]}`,
        });
      }
    }
  }

  // Validate description
  if (!transaction.description) {
    errors.push({
      type: "MISSING_DESCRIPTION",
      message: "Description is required",
    });
  } else if (transaction.description.length > 255) {
    errors.push({
      type: "DESCRIPTION_TOO_LONG",
      message: `Description exceeds 255 characters: ${transaction.description.length}`,
    });
  }

  // Validate amount
  if (transaction.amount === undefined || transaction.amount === null) {
    errors.push({ type: "MISSING_AMOUNT", message: "Amount is required" });
  } else {
    if (!Number.isFinite(transaction.amount)) {
      errors.push({
        type: "INVALID_AMOUNT",
        message: `Invalid amount: ${transaction.amount}`,
      });
    } else if (rules.minAmount && transaction.amount < rules.minAmount) {
      errors.push({
        type: "AMOUNT_OUT_OF_RANGE",
        message: `Amount ${transaction.amount} is below minimum ${rules.minAmount}`,
      });
    } else if (rules.maxAmount && transaction.amount > rules.maxAmount) {
      errors.push({
        type: "AMOUNT_OUT_OF_RANGE",
        message: `Amount ${transaction.amount} exceeds maximum ${rules.maxAmount}`,
      });
    }
  }

  // Validate type
  if (!transaction.type) {
    errors.push({
      type: "MISSING_TYPE",
      message: "Transaction type is required",
    });
  } else if (
    rules.allowedTypes &&
    !rules.allowedTypes.includes(transaction.type)
  ) {
    errors.push({
      type: "INVALID_TYPE",
      message: `Invalid transaction type: ${transaction.type}`,
    });
  }

  // Validate currency
  if (
    transaction.currency &&
    rules.allowedCurrencies &&
    !rules.allowedCurrencies.includes(transaction.currency)
  ) {
    errors.push({
      type: "INVALID_CURRENCY",
      message: `Unsupported currency: ${transaction.currency}`,
    });
  }

  // Validate user_id
  if (!transaction.user_id) {
    errors.push({ type: "MISSING_USER_ID", message: "User ID is required" });
  }

  // Validate source_file_id
  if (!transaction.source_file_id) {
    errors.push({
      type: "MISSING_SOURCE_FILE_ID",
      message: "Source file ID is required",
    });
  }

  return errors;
}

/**
 * Get validation statistics
 */
export function getValidationStats(
  total: number,
  valid: number,
  errors: ParseError[],
): {
  totalTransactions: number;
  validTransactions: number;
  invalidTransactions: number;
  successRate: number;
  errorsByType: Record<string, number>;
} {
  const errorsByType: Record<string, number> = {};

  for (const error of errors) {
    errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1;
  }

  return {
    totalTransactions: total,
    validTransactions: valid,
    invalidTransactions: total - valid,
    successRate: total > 0 ? (valid / total) * 100 : 0,
    errorsByType,
  };
}
