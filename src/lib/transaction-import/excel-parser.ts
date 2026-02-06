/**
 * Excel Parser Core
 * Handles .xlsx and .xls file parsing with multi-sheet support
 */

import * as XLSX from 'xlsx';
import { BankConfig } from './bank-configs';
import { ParsedTransaction, ParseResult, ParseError } from './csv-parser';

/**
 * Parse Excel file using bank-specific configuration
 */
export async function parseExcel(
  fileBuffer: Buffer,
  bankConfig: BankConfig
): Promise<ParseResult> {
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];
  let totalRows = 0;

  try {
    // Read workbook
    const workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false,
    });

    // Get target sheet
    const sheetName =
      typeof bankConfig.excelConfig.sheetName === 'string'
        ? bankConfig.excelConfig.sheetName
        : workbook.SheetNames[bankConfig.excelConfig.sheetName];

    if (!sheetName || !workbook.Sheets[sheetName]) {
      throw new Error(`Sheet not found: ${sheetName}`);
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Use array of arrays
      raw: false, // Convert values to strings
      defval: '', // Default value for empty cells
    }) as any[][];

    totalRows = rows.length;

    // Skip to header row
    const headerRowIndex = bankConfig.excelConfig.headerRow - 1;
    const headers = rows[headerRowIndex];

    // Process data rows
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;

      // Skip empty rows
      if (row.every((cell) => !cell || cell.toString().trim() === '')) {
        continue;
      }

      try {
        const transaction = extractTransactionFromExcel(
          row,
          headers,
          bankConfig,
          rowNumber
        );
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        errors.push({
          rowNumber,
          errorType: 'PARSING_ERROR',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          rawData: { row, headers },
        });
      }
    }

    return {
      transactions,
      errors,
      totalRows,
      successfulRows: transactions.length,
    };
  } catch (error) {
    errors.push({
      rowNumber: 0,
      errorType: 'FILE_PARSING_ERROR',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      rawData: {},
    });

    return {
      transactions: [],
      errors,
      totalRows: 0,
      successfulRows: 0,
    };
  }
}

/**
 * Extract transaction from Excel row
 */
function extractTransactionFromExcel(
  row: any[],
  headers: any[],
  bankConfig: BankConfig,
  rowNumber: number
): ParsedTransaction | null {
  const { excelConfig } = bankConfig;

  // Get column indices
  const dateIndex = getColumnIndex(excelConfig.dateColumn, headers);
  const merchantIndex = getColumnIndex(excelConfig.merchantColumn, headers);
  const balanceIndex = getColumnIndex(excelConfig.balanceColumn, headers);

  // Extract date
  const dateStr = row[dateIndex];
  if (!dateStr) {
    throw new Error(`Missing date in column ${excelConfig.dateColumn}`);
  }

  const date = parseDate(dateStr, excelConfig.dateFormat);
  if (!date) {
    throw new Error(`Invalid date format: "${dateStr}" (expected ${excelConfig.dateFormat})`);
  }

  // Extract merchant
  const merchant = row[merchantIndex]?.toString().trim();
  if (!merchant) {
    throw new Error(`Missing merchant in column ${excelConfig.merchantColumn}`);
  }

  // Extract amount (debit/credit)
  let amount: number;
  let type: 'debit' | 'credit';

  if (excelConfig.amountColumn) {
    // Single amount column
    const amountIndex = getColumnIndex(excelConfig.amountColumn, headers);
    const amountStr = row[amountIndex];
    amount = parseAmount(amountStr);
    type = amount < 0 ? 'debit' : 'credit';
    amount = Math.abs(amount);
  } else if (excelConfig.debitColumn && excelConfig.creditColumn) {
    // Separate debit/credit columns
    const debitIndex = getColumnIndex(excelConfig.debitColumn, headers);
    const creditIndex = getColumnIndex(excelConfig.creditColumn, headers);

    const debitStr = row[debitIndex];
    const creditStr = row[creditIndex];

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
  const balanceStr = row[balanceIndex];
  const balance = parseAmount(balanceStr);

  // Extract reference (optional)
  let reference: string | undefined;
  if (excelConfig.referenceColumn) {
    const refIndex = getColumnIndex(excelConfig.referenceColumn, headers);
    reference = row[refIndex]?.toString().trim();
  }

  // Create raw data object
  const rawData: Record<string, any> = {};
  headers.forEach((header, index) => {
    if (header) {
      rawData[header.toString()] = row[index];
    }
  });

  return {
    date,
    merchant,
    amount,
    type,
    balance,
    reference,
    rawData,
  };
}

/**
 * Get column index from letter or number
 */
function getColumnIndex(column: string | number, headers: any[]): number {
  if (typeof column === 'number') {
    return column;
  }

  // Convert column letter to index (A=0, B=1, etc.)
  if (typeof column === 'string' && column.length === 1) {
    return column.toUpperCase().charCodeAt(0) - 65;
  }

  // Try to find column by header name
  const headerIndex = headers.findIndex(
    (h) => h && h.toString().toLowerCase() === column.toLowerCase()
  );

  if (headerIndex >= 0) {
    return headerIndex;
  }

  throw new Error(`Column not found: ${column}`);
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr: string, format: string): string | null {
  if (!dateStr) return null;

  // Handle Excel date serial numbers
  if (typeof dateStr === 'number' || /^\d+$/.test(dateStr)) {
    const excelDate = typeof dateStr === 'number' ? dateStr : parseInt(dateStr, 10);
    const date = XLSX.SSF.parse_date_code(excelDate);
    if (date) {
      return new Date(date.y, date.m - 1, date.d).toISOString().split('T')[0];
    }
  }

  const cleaned = dateStr.toString().trim();
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
