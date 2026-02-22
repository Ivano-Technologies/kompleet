/**
 * CSV Parser Core
 * Handles CSV file parsing with error handling and encoding detection
 */

import Papa from "papaparse";
import * as chardet from "chardet";
import * as iconv from "iconv-lite";
import { BankConfig } from "./bank-configs";

export interface ParsedTransaction {
  date: string;
  merchant: string;
  amount: number;
  type: "debit" | "credit";
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
 * Detect encoding and decode buffer to string
 * Handles UTF-8 BOM, Latin-1, Windows-1252, and other encodings
 */
function detectAndDecode(buffer: Buffer): string {
  // Check for UTF-8 BOM (Byte Order Mark)
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    console.log("Detected UTF-8 BOM, stripping...");
    return buffer.slice(3).toString("utf-8");
  }

  // Detect encoding using chardet
  const detected = chardet.detect(buffer);
  const encoding = detected || "utf-8";

  console.log(`Detected encoding: ${encoding}`);

  // Decode using detected encoding
  try {
    return iconv.decode(buffer, encoding);
  } catch (error) {
    console.warn(`Failed to decode with ${encoding}, falling back to UTF-8`);
    return buffer.toString("utf-8");
  }
}

/**
 * Parse CSV file from buffer with automatic encoding detection
 */
export async function parseCSVFromBuffer(
  fileBuffer: Buffer,
  bankConfig: BankConfig,
): Promise<ParseResult> {
  const fileContent = detectAndDecode(fileBuffer);
  return parseCSV(fileContent, bankConfig);
}

/**
 * Parse CSV file using bank-specific configuration
 */
export async function parseCSV(
  fileContent: string,
  bankConfig: BankConfig,
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
              errorType: "PARSING_ERROR",
              errorMessage:
                error instanceof Error ? error.message : "Unknown error",
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
      error: (error: Error) => {
        errors.push({
          rowNumber: 0,
          errorType: "FILE_PARSING_ERROR",
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
  rowNumber: number,
): ParsedTransaction | null {
  const { csvConfig } = bankConfig;

  // Extract date
  const dateStr = row[csvConfig.dateColumn];
  if (!dateStr) {
    throw new Error(`Missing date in column "${csvConfig.dateColumn}"`);
  }

  const date = parseDate(dateStr, csvConfig.dateFormat);
  if (!date) {
    throw new Error(
      `Invalid date format: "${dateStr}" (expected ${csvConfig.dateFormat})`,
    );
  }

  // Extract merchant
  const merchant = row[csvConfig.merchantColumn]?.toString().trim();
  if (!merchant) {
    throw new Error(`Missing merchant in column "${csvConfig.merchantColumn}"`);
  }

  // Extract amount (debit/credit)
  let amount: number;
  let type: "debit" | "credit";

  if (csvConfig.amountColumn) {
    // Single amount column
    const amountStr = row[csvConfig.amountColumn];
    amount = parseAmount(amountStr);
    type = amount < 0 ? "debit" : "credit";
    amount = Math.abs(amount);
  } else if (csvConfig.debitColumn && csvConfig.creditColumn) {
    // Separate debit/credit columns
    const debitStr = row[csvConfig.debitColumn];
    const creditStr = row[csvConfig.creditColumn];

    const debit = parseAmount(debitStr);
    const credit = parseAmount(creditStr);

    if (debit > 0) {
      amount = debit;
      type = "debit";
    } else if (credit > 0) {
      amount = credit;
      type = "credit";
    } else {
      throw new Error("Both debit and credit are zero or empty");
    }
  } else {
    throw new Error("Invalid bank configuration: missing amount columns");
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
 * Parse date string to ISO format with validation (CRIT-002)
 * Validates dates to prevent invalid dates like Feb 29, 2023
 */
function parseDate(dateStr: string, format: string): string | null {
  if (!dateStr || dateStr.trim() === "") return null;

  const cleaned = dateStr.trim();
  let day: number, month: number, year: number;

  try {
    if (format === "DD/MM/YYYY" || format === "DD-MM-YYYY") {
      const parts = cleaned.split(/[\/\-]/);
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else if (format === "MM/DD/YYYY" || format === "MM-DD-YYYY") {
      const parts = cleaned.split(/[\/\-]/);
      month = parseInt(parts[0], 10);
      day = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else if (format === "YYYY-MM-DD") {
      const parts = cleaned.split("-");
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (format === "DD-MMM-YYYY") {
      const parts = cleaned.split("-");
      day = parseInt(parts[0], 10);
      const monthStr = parts[1];
      year = parseInt(parts[2], 10);

      const months: Record<string, number> = {
        JAN: 1,
        FEB: 2,
        MAR: 3,
        APR: 4,
        MAY: 5,
        JUN: 6,
        JUL: 7,
        AUG: 8,
        SEP: 9,
        OCT: 10,
        NOV: 11,
        DEC: 12,
      };

      month = months[monthStr?.toUpperCase()];
      if (!month) {
        console.error(`Invalid month: ${monthStr}`);
        return null;
      }
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

    // Create date and validate it's actually valid
    // This catches cases like Feb 31, Feb 29 on non-leap years, etc.
    const parsedDate = new Date(year, month - 1, day);

    // Check if the date components match what we parsed
    if (
      parsedDate.getDate() !== day ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getFullYear() !== year
    ) {
      console.error(
        `Invalid date: ${dateStr} - Date doesn't exist in calendar`,
      );
      return null;
    }

    // Additional sanity checks
    const now = new Date();
    const minDate = new Date("1990-01-01");

    if (parsedDate > now) {
      console.warn(
        `Suspicious date in future: ${dateStr}, parsed as ${parsedDate.toISOString()}`,
      );
    }

    if (parsedDate < minDate) {
      console.warn(
        `Suspicious date too far in past: ${dateStr}, parsed as ${parsedDate.toISOString()}`,
      );
    }

    // Convert to ISO format
    const isoDate = parsedDate.toISOString().split("T")[0];
    return isoDate;
  } catch (error) {
    console.error(`Error parsing date "${dateStr}":`, error);
    return null;
  }
}

/**
 * Parse amount string to number with support for European formats (CRIT-003)
 * Handles formats like 1.234,56 (European) and 1,234.56 (US)
 * Also handles CR/DR suffixes and parentheses for negative amounts
 */
function parseAmount(amountStr: string | number | undefined): number {
  if (amountStr === undefined || amountStr === null || amountStr === "") {
    return 0;
  }

  if (typeof amountStr === "number") {
    return amountStr;
  }

  let cleaned = amountStr.toString().trim();

  // Check for negative indicators
  const isNegative =
    cleaned.includes("(") || cleaned.toUpperCase().endsWith("CR");

  // Remove parentheses and CR/DR suffixes
  cleaned = cleaned
    .replace(/[()]/g, "")
    .replace(/\s*CR\s*$/i, "")
    .replace(/\s*DR\s*$/i, "");

  // Remove currency symbols
  cleaned = cleaned.replace(/[₦\$€£¥NGN]/gi, "").trim();

  if (!cleaned) {
    return 0;
  }

  // Handle scientific notation (e.g., 1.23E+09)
  if (/\d+\.?\d*[Ee][+-]?\d+/.test(cleaned)) {
    const amount = parseFloat(cleaned);
    if (!isNaN(amount)) {
      return isNegative ? -Math.abs(amount) : amount;
    }
  }

  // Determine decimal separator
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  // European format: 1.234,56 (comma is decimal separator)
  if (lastComma > lastDot && lastComma > 0) {
    const afterComma = cleaned.substring(lastComma + 1);
    // If there are 1-2 digits after comma, it's likely decimal separator
    if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // Otherwise, remove commas
      cleaned = cleaned.replace(/,/g, "");
    }
  } else {
    // US format: 1,234.56 (comma is thousands separator)
    cleaned = cleaned.replace(/,/g, "");
  }

  const amount = parseFloat(cleaned);

  if (isNaN(amount)) {
    throw new Error(`Invalid amount: "${amountStr}"`);
  }

  return isNegative ? -Math.abs(amount) : amount;
}
