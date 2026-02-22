/**
 * Transaction Normalizer
 * Standardizes parsed transactions for database storage
 * MED-001: Enhanced to preserve raw merchant data and extracted metadata
 */

import { ParsedTransaction } from "./csv-parser";

export interface NormalizedTransaction {
  date: string; // ISO format YYYY-MM-DD
  merchant: string; // Cleaned and standardized
  amount: number; // Always positive
  type: "debit" | "credit";
  balance: number;
  reference?: string;
  category?: string; // Auto-categorized if available
  notes?: string;
  metadata: Record<string, any>;
}

/**
 * MED-001: Enhanced merchant normalization with metadata preservation
 */
interface MerchantNormalizationResult {
  normalized: string;
  metadata: {
    rawMerchant: string;
    removedPrefixes: string[];
    extractedReferences: string[];
    extractedDates: string[];
    extractedTimes: string[];
  };
}

/**
 * Normalize a single transaction
 * MED-001: Enhanced to preserve raw merchant and extracted metadata
 */
export function normalizeTransaction(
  transaction: ParsedTransaction,
  bankCode: string,
): NormalizedTransaction {
  const merchantResult = normalizeMerchantWithMetadata(transaction.merchant);

  return {
    date: transaction.date,
    merchant: merchantResult.normalized,
    amount: Math.abs(transaction.amount),
    type: transaction.type,
    balance: transaction.balance,
    reference: transaction.reference,
    metadata: {
      bankCode,
      ...merchantResult.metadata,
      rawData: transaction.rawData,
    },
  };
}

/**
 * MED-001: Normalize merchant name and preserve extracted metadata
 * - Remove extra whitespace
 * - Standardize common patterns
 * - Extract and preserve prefixes, references, dates, times
 */
function normalizeMerchantWithMetadata(
  merchant: string,
): MerchantNormalizationResult {
  if (!merchant) {
    return {
      normalized: "Unknown",
      metadata: {
        rawMerchant: "",
        removedPrefixes: [],
        extractedReferences: [],
        extractedDates: [],
        extractedTimes: [],
      },
    };
  }

  let normalized = merchant.trim();
  const rawMerchant = normalized;
  const removedPrefixes: string[] = [];
  const extractedReferences: string[] = [];
  const extractedDates: string[] = [];
  const extractedTimes: string[] = [];

  // Remove multiple spaces
  normalized = normalized.replace(/\s+/g, " ");

  // Extract and remove common prefixes
  const prefixes = [
    "POS",
    "ATM",
    "WEB",
    "MOBILE",
    "TRANSFER",
    "PAYMENT",
    "PURCHASE",
  ];
  prefixes.forEach((prefix) => {
    const regex = new RegExp(`^${prefix}\\s*`, "i");
    if (regex.test(normalized)) {
      removedPrefixes.push(prefix);
      normalized = normalized.replace(regex, "");
    }
  });

  // Extract transaction reference patterns (10+ alphanumeric characters)
  normalized = normalized.replace(/\b[A-Z0-9]{10,}\b/g, (match) => {
    extractedReferences.push(match);
    return "";
  });

  // Extract date patterns
  normalized = normalized.replace(
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g,
    (match) => {
      extractedDates.push(match);
      return "";
    },
  );

  // Extract time patterns
  normalized = normalized.replace(/\d{1,2}:\d{2}(:\d{2})?/g, (match) => {
    extractedTimes.push(match);
    return "";
  });

  // Remove extra whitespace again
  normalized = normalized.replace(/\s+/g, " ").trim();

  // Capitalize first letter of each word
  normalized = normalized
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    normalized: normalized || "Unknown",
    metadata: {
      rawMerchant,
      removedPrefixes,
      extractedReferences,
      extractedDates,
      extractedTimes,
    },
  };
}

/**
 * Legacy function for backward compatibility
 */
function normalizeMerchant(merchant: string): string {
  return normalizeMerchantWithMetadata(merchant).normalized;
}

/**
 * Normalize batch of transactions
 */
export function normalizeTransactions(
  transactions: ParsedTransaction[],
  bankCode: string,
): NormalizedTransaction[] {
  return transactions.map((transaction) =>
    normalizeTransaction(transaction, bankCode),
  );
}

/**
 * Validate normalized transaction
 */
export function validateNormalizedTransaction(
  transaction: NormalizedTransaction,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate date
  if (!transaction.date || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
    errors.push("Invalid date format");
  }

  // Validate merchant
  if (!transaction.merchant || transaction.merchant.trim() === "") {
    errors.push("Missing merchant");
  }

  // Validate amount
  if (typeof transaction.amount !== "number" || transaction.amount < 0) {
    errors.push("Invalid amount");
  }

  // Validate type
  if (transaction.type !== "debit" && transaction.type !== "credit") {
    errors.push("Invalid transaction type");
  }

  // Validate balance
  if (typeof transaction.balance !== "number") {
    errors.push("Invalid balance");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
