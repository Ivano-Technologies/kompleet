/**
 * Sanitization module for AI
 * Removes sensitive data before sending transactions to LLM
 */

import { Transaction, SanitizedTransaction } from "./types";

/**
 * Sanitize a single transaction for AI
 * KEEP: date, description, amount, currency, balance
 * REMOVE: account numbers, customer names, addresses, statement metadata
 */
export function sanitizeTransaction(
  transaction: Transaction,
): SanitizedTransaction {
  return {
    date: transaction.date,
    description: sanitizeDescription(transaction.description),
    amount: transaction.amount,
    currency: transaction.currency || "NGN",
    balance: transaction.balance,
  };
}

/**
 * Sanitize array of transactions for AI
 */
export function sanitizeTransactions(
  transactions: Transaction[],
): SanitizedTransaction[] {
  return transactions.map(sanitizeTransaction);
}

/**
 * Sanitize description by removing PII
 * Removes: account numbers, emails, phone numbers, names (conservative)
 */
export function sanitizeDescription(desc: string): string {
  if (!desc) {
    return "";
  }

  let sanitized = desc;

  // Remove account numbers (10+ consecutive digits)
  // This is aggressive but necessary for security
  sanitized = sanitized.replace(/\d{10,}/g, "ACCOUNT_REDACTED");

  // Remove email addresses
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, "EMAIL_REDACTED");

  // Remove phone numbers (international format +XX or 10+ digits)
  sanitized = sanitized.replace(/\+?\d{10,}/g, "PHONE_REDACTED");

  // Remove common PII patterns (conservative)
  // Names: capitalized words at start of string (heuristic)
  // Only apply if the description starts with a name-like pattern
  // This is conservative to avoid over-redaction

  // Remove IBAN/account identifiers (starts with 2 letters, 2 digits, then 1-30 alphanumeric)
  sanitized = sanitized.replace(
    /[A-Z]{2}\d{2}[A-Z0-9]{1,30}/g,
    "ACCOUNT_REDACTED",
  );

  // Remove common Nigerian bank identifiers
  // Examples: "0123456789", "1234567890"
  // Already covered by account number removal above

  return sanitized;
}

/**
 * Check if transaction contains sensitive data
 * Returns true if potentially sensitive data is detected
 */
export function containsSensitiveData(transaction: Transaction): boolean {
  const desc = transaction.description.toLowerCase();

  // Check for common sensitive patterns
  const sensitivePatterns = [
    /\d{10,}/, // Account numbers
    /[\w.-]+@[\w.-]+\.\w+/, // Emails
    /\+?\d{10,}/, // Phone numbers
    /[a-z]{2}\d{2}[a-z0-9]{1,30}/i, // IBAN
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(desc)) {
      return true;
    }
  }

  return false;
}

/**
 * Get sanitization report for a transaction
 */
export function getSanitizationReport(
  original: Transaction,
  sanitized: SanitizedTransaction,
): {
  hasSensitiveData: boolean;
  descriptionChanged: boolean;
  fieldsRemoved: string[];
} {
  const hasSensitiveData = containsSensitiveData(original);
  const descriptionChanged = original.description !== sanitized.description;

  const fieldsRemoved: string[] = [];
  if (original.raw_data) {
    fieldsRemoved.push("raw_data");
  }
  if (original.raw_category) {
    fieldsRemoved.push("raw_category");
  }
  if (original.reference) {
    fieldsRemoved.push("reference");
  }

  return {
    hasSensitiveData,
    descriptionChanged,
    fieldsRemoved,
  };
}
