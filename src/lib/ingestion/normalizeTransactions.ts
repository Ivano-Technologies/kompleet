/**
 * Normalize raw transaction rows to canonical Transaction schema
 * Handles date parsing, amount normalization, type detection
 */

import { Transaction, RawRow, ParseError } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Normalize array of raw rows to Transaction schema
 */
export function normalizeTransactions(
  rawRows: RawRow[],
  fileType: string,
  userId: string,
  sourceFileId: string
): { transactions: Transaction[]; errors: ParseError[] } {
  const transactions: Transaction[] = [];
  const errors: ParseError[] = [];

  rawRows.forEach((row, index) => {
    try {
      const transaction = normalizeRow(row, index, userId, sourceFileId);
      if (transaction) {
        transactions.push(transaction);
      }
    } catch (error) {
      errors.push({
        rowNumber: index + 1,
        errorType: 'NORMALIZATION_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        rawData: row,
      });
    }
  });

  return { transactions, errors };
}

/**
 * Normalize a single raw row to Transaction
 */
function normalizeRow(
  row: RawRow,
  rowIndex: number,
  userId: string,
  sourceFileId: string
): Transaction | null {
  // Skip empty rows
  if (!row.date || !row.description || !row.amount) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: uuidv4(),
    user_id: userId,
    source_file_id: sourceFileId,

    // Normalize date
    date: normalizeDate(row.date),

    // Normalize description
    description: normalizeDescription(row.description),

    // Normalize amount
    amount: normalizeAmount(row.amount),

    // Detect transaction type
    type: detectTransactionType(row),

    // Optional fields
    currency: 'NGN', // Default to Nigerian Naira
    balance: row.balance ? normalizeAmount(row.balance) : undefined,
    reference: row.reference?.toString().trim() || undefined,

    // Metadata
    raw_data: row,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Normalize date to ISO 8601 format (YYYY-MM-DD)
 * Handles multiple formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-Mon-YYYY
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) {
    throw new Error('Date is required');
  }

  const trimmed = dateStr.toString().trim();

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return trimmed;
    }
  }

  // Try DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Heuristic: if day > 12, it's DD/MM/YYYY; otherwise could be either
    if (day > 12) {
      return formatDate(year, month, day);
    }

    // Try DD/MM/YYYY first
    const ddmmDate = new Date(year, month - 1, day);
    if (isValidDate(ddmmDate, day, month, year)) {
      return formatDate(year, month, day);
    }

    // Try MM/DD/YYYY
    const mmddDate = new Date(year, day - 1, month);
    if (isValidDate(mmddDate, month, day, year)) {
      return formatDate(year, day, month);
    }
  }

  // Try MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    return formatDate(year, month, day);
  }

  // Try DD-Mon-YYYY or DD-MMM-YYYY
  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Try parsing with Date constructor
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  throw new Error(`Invalid date format: ${dateStr}`);
}

/**
 * Check if date is valid
 */
function isValidDate(date: Date, day: number, month: number, year: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(year: number, month: number, day: number): string {
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

/**
 * Normalize description (merchant/narration)
 * Removes account numbers, limits length
 */
export function normalizeDescription(desc: string): string {
  if (!desc) {
    return '';
  }

  let normalized = desc.toString().trim();

  // Remove account numbers (10+ consecutive digits)
  normalized = normalized.replace(/\d{10,}/g, '[ACCOUNT_REDACTED]');

  // Limit to 255 characters
  if (normalized.length > 255) {
    normalized = normalized.substring(0, 252) + '...';
  }

  return normalized;
}

/**
 * Normalize amount to number
 * Removes currency symbols, commas, handles scientific notation
 */
export function normalizeAmount(amountStr: string): number {
  if (!amountStr) {
    throw new Error('Amount is required');
  }

  let normalized = amountStr.toString().trim();

  // Remove currency symbols (₦, NGN, $, €, etc.)
  normalized = normalized.replace(/[₦$€£¥NGN]/gi, '');

  // Remove commas
  normalized = normalized.replace(/,/g, '');

  // Handle scientific notation (1.23E+09)
  const amount = parseFloat(normalized);

  if (isNaN(amount)) {
    throw new Error(`Invalid amount: ${amountStr}`);
  }

  // Return absolute value (always positive)
  return Math.abs(amount);
}

/**
 * Detect transaction type (debit or credit)
 * Heuristics: type field, amount sign, description keywords
 */
export function detectTransactionType(row: RawRow): 'debit' | 'credit' {
  // Check 'type' field first
  if (row.type) {
    const type = row.type.toString().toUpperCase();
    if (type.includes('DR') || type.includes('DEBIT') || type.includes('WITHDRAWAL')) {
      return 'debit';
    }
    if (type.includes('CR') || type.includes('CREDIT') || type.includes('DEPOSIT')) {
      return 'credit';
    }
  }

  // Check description for keywords
  const desc = (row.description || '').toString().toUpperCase();
  if (desc.includes('WITHDRAWAL') || desc.includes('ATM') || desc.includes('TRANSFER OUT')) {
    return 'debit';
  }
  if (desc.includes('DEPOSIT') || desc.includes('TRANSFER IN') || desc.includes('CREDIT')) {
    return 'credit';
  }

  // Check amount sign (if available)
  if (row.amount) {
    const amountStr = row.amount.toString();
    if (amountStr.includes('-') || amountStr.startsWith('(')) {
      return 'debit';
    }
  }

  // Default to debit (conservative)
  return 'debit';
}
