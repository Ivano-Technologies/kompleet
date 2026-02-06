/**
 * Transaction Normalizer
 * Standardizes parsed transactions for database storage
 */

import { ParsedTransaction } from './csv-parser';

export interface NormalizedTransaction {
  date: string; // ISO format YYYY-MM-DD
  merchant: string; // Cleaned and standardized
  amount: number; // Always positive
  type: 'debit' | 'credit';
  balance: number;
  reference?: string;
  category?: string; // Auto-categorized if available
  notes?: string;
  metadata: Record<string, any>;
}

/**
 * Normalize a single transaction
 */
export function normalizeTransaction(
  transaction: ParsedTransaction,
  bankCode: string
): NormalizedTransaction {
  return {
    date: transaction.date,
    merchant: normalizeMerchant(transaction.merchant),
    amount: Math.abs(transaction.amount),
    type: transaction.type,
    balance: transaction.balance,
    reference: transaction.reference,
    metadata: {
      bankCode,
      rawMerchant: transaction.merchant,
      rawData: transaction.rawData,
    },
  };
}

/**
 * Normalize merchant name
 * - Remove extra whitespace
 * - Standardize common patterns
 * - Extract meaningful merchant name from transaction details
 */
function normalizeMerchant(merchant: string): string {
  if (!merchant) return 'Unknown';

  let normalized = merchant.trim();

  // Remove multiple spaces
  normalized = normalized.replace(/\s+/g, ' ');

  // Remove common prefixes
  normalized = normalized.replace(/^(POS|ATM|WEB|MOBILE|TRANSFER|PAYMENT|PURCHASE)\s*/i, '');

  // Remove transaction reference patterns
  normalized = normalized.replace(/\b[A-Z0-9]{10,}\b/g, '');

  // Remove date patterns
  normalized = normalized.replace(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, '');

  // Remove time patterns
  normalized = normalized.replace(/\d{1,2}:\d{2}(:\d{2})?/g, '');

  // Remove extra whitespace again
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Capitalize first letter of each word
  normalized = normalized
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return normalized || 'Unknown';
}

/**
 * Normalize batch of transactions
 */
export function normalizeTransactions(
  transactions: ParsedTransaction[],
  bankCode: string
): NormalizedTransaction[] {
  return transactions.map((transaction) => normalizeTransaction(transaction, bankCode));
}

/**
 * Validate normalized transaction
 */
export function validateNormalizedTransaction(
  transaction: NormalizedTransaction
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate date
  if (!transaction.date || !/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) {
    errors.push('Invalid date format');
  }

  // Validate merchant
  if (!transaction.merchant || transaction.merchant.trim() === '') {
    errors.push('Missing merchant');
  }

  // Validate amount
  if (typeof transaction.amount !== 'number' || transaction.amount < 0) {
    errors.push('Invalid amount');
  }

  // Validate type
  if (transaction.type !== 'debit' && transaction.type !== 'credit') {
    errors.push('Invalid transaction type');
  }

  // Validate balance
  if (typeof transaction.balance !== 'number') {
    errors.push('Invalid balance');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
