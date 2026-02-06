/**
 * CSV Parser Core
 * Handles CSV file parsing with error handling and encoding detection
 */

import Papa from 'papaparse';
import { BankConfig } from './bank-configs';

export interface ParsedTransaction {
  date: string;
  merchant: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number;
  reference?: string;
  rawData: Record<string, any>;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: ParseError[];
  totalRows: number;
  successfulRows: number;
}

export interface ParseError {
  rowNumber: number;
  errorType: string;
  errorMessage: string;
  rawData: Record<string, any>;
}

/**
 * Parse CSV file using bank-specific configuration
 */
export async function parseCSV(
  fileContent: string,
  bankConfig: BankConfig
): Promise<ParseResult> {
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];
  let totalRows = 0;

  return new Promise((resolve) => {
    Papa.parse(fileContent, {
      header: bankConfig.csvConfig.hasHeader,
      skipEmptyLines: true,
      delimiter: bankConfig.csvConfig.delimiter,
      encoding: bankConfig.csvConfig.encoding,
      complete: (results) => {
        const rows = results.data as Record<string, any>[];
        totalRows = rows.length;

        // Skip header rows if configured
        const dataRows = rows.slice(bankConfig.csvConfig.skipRows);

        dataRows.forEach((row, index) => {
          const rowNumber = index + bankConfig.csvConfig.skipRows + 1;

          try {
            const transaction = extractTransaction(row, bankConfig, rowNumber);
            if (transaction) {
              transactions.push(transaction);
            }
          } catch (error) {
            errors.push({
              rowNumber,
              errorType: 'PARSING_ERROR',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              rawData: row,
            });
          }
        });

        resolve({
          transactions,
          errors,
          totalRows,
          successfulRows: transactions.length,
        });
      },
      error: (error) => {
        errors.push({
          rowNumber: 0,
          errorType: 'FILE_PARSING_ERROR',
          errorMessage: error.message,
          rawData: {},
        });

        resolve({
          transactions: [],
          errors,
          totalRows: 0,
          successfulRows: 0,
        });
      },
    });
  });
}

/**
 * Extract transaction from CSV row
 */
function extractTransaction(
  row: Record<string, any>,
  bankConfig: BankConfig,
  rowNumber: number
): ParsedTransaction | null {
  const { csvConfig } = bankConfig;

  // Extract date
  const dateStr = row[csvConfig.dateColumn];
  if (!dateStr) {
    throw new Error(`Missing date in column "${csvConfig.dateColumn}"`);
  }

  const date = parseDate(dateStr, csvConfig.dateFormat);
  if (!date) {
    throw new Error(`Invalid date format: "${dateStr}" (expected ${csvConfig.dateFormat})`);
  }

  // Extract merchant
  const merchant = row[csvConfig.merchantColumn]?.toString().trim();
  if (!merchant) {
    throw new Error(`Missing merchant in column "${csvConfig.merchantColumn}"`);
  }

  // Extract amount (debit/credit)
  let amount: number;
  let type: 'debit' | 'credit';

  if (csvConfig.amountColumn) {
    // Single amount column
    const amountStr = row[csvConfig.amountColumn];
    amount = parseAmount(amountStr);
    type = amount < 0 ? 'debit' : 'credit';
    amount = Math.abs(amount);
  } else if (csvConfig.debitColumn && csvConfig.creditColumn) {
    // Separate debit/credit columns
    const debitStr = row[csvConfig.debitColumn];
    const creditStr = row[csvConfig.creditColumn];

    const debit = parseAmount(debitStr);
    const credit = parseAmount(creditStr);

    if (debit > 0) {
      amount = debit;
      type = 'debit';
    } else if (credit > 0) {
      amount = credit;
      type = 'credit';
    } else {
      throw new Error('Both debit and credit are zero or empty');
    }
  } else {
    throw new Error('Invalid bank configuration: missing amount columns');
  }

  // Extract balance
  const balanceStr = row[csvConfig.balanceColumn];
  const balance = parseAmount(balanceStr);

  // Extract reference (optional)
  const reference = csvConfig.referenceColumn
    ? row[csvConfig.referenceColumn]?.toString().trim()
    : undefined;

  return {
    date,
    merchant,
    amount,
    type,
    balance,
    reference,
    rawData: row,
  };
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr: string, format: string): string | null {
  if (!dateStr) return null;

  const cleaned = dateStr.trim();
  let day: number, month: number, year: number;

  try {
    if (format === 'DD/MM/YYYY' || format === 'DD-MM-YYYY') {
      const parts = cleaned.split(/[\/\-]/);
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else if (format === 'MM/DD/YYYY' || format === 'MM-DD-YYYY') {
      const parts = cleaned.split(/[\/\-]/);
      month = parseInt(parts[0], 10);
      day = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else if (format === 'YYYY-MM-DD') {
      const parts = cleaned.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      return null;
    }

    // Validate date components
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return null;
    }

    if (day < 1 || day > 31 || month < 1 || month > 12) {
      return null;
    }

    // Convert to ISO format
    const isoDate = new Date(year, month - 1, day).toISOString().split('T')[0];
    return isoDate;
  } catch (error) {
    return null;
  }
}

/**
 * Parse amount string to number
 */
function parseAmount(amountStr: string | number | undefined): number {
  if (amountStr === undefined || amountStr === null || amountStr === '') {
    return 0;
  }

  if (typeof amountStr === 'number') {
    return amountStr;
  }

  // Remove currency symbols and commas
  const cleaned = amountStr
    .toString()
    .replace(/[₦NGN,\s]/gi, '')
    .trim();

  if (!cleaned) {
    return 0;
  }

  const amount = parseFloat(cleaned);

  if (isNaN(amount)) {
    throw new Error(`Invalid amount: "${amountStr}"`);
  }

  return amount;
}
