/**
 * CSV Parser Core
 * Handles CSV file parsing with error handling, encoding detection,
 * preamble skip, and fuzzy column matching for real bank exports.
 */

import Papa from "papaparse";
import * as chardet from "chardet";
import * as iconv from "iconv-lite";
import { BankConfig } from "./bank-configs";
import {
  AMOUNT_ALIASES,
  BALANCE_ALIASES,
  CREDIT_ALIASES,
  DATE_ALIASES,
  DEBIT_ALIASES,
  MERCHANT_ALIASES,
  REFERENCE_ALIASES,
  detectDelimiter,
  findMatchingHeader,
  rowLooksLikeHeader,
  stripBom,
} from "./column-aliases";

export interface ParsedTransaction {
  date: string;
  merchant: string;
  amount: number;
  type: "debit" | "credit";
  balance: number;
  reference?: string;
  rawData: Record<string, unknown>;
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
  rawData: Record<string, unknown>;
}

interface ColumnMap {
  date?: string;
  merchant?: string;
  amount?: string;
  debit?: string;
  credit?: string;
  balance?: string;
  reference?: string;
}

const MONTHS: Record<string, number> = {
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

/**
 * Detect encoding and decode buffer to string
 * Handles UTF-8 BOM, Latin-1, Windows-1252, and other encodings
 */
function detectAndDecode(buffer: Buffer): string {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    return buffer.slice(3).toString("utf-8");
  }

  const detected = chardet.detect(buffer);
  const encoding = detected || "utf-8";

  try {
    return iconv.decode(buffer, encoding);
  } catch {
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

function parseRows(
  fileContent: string,
  delimiter: string,
): string[][] {
  const parsed = Papa.parse<string[]>(fileContent, {
    header: false,
    skipEmptyLines: "greedy",
    delimiter,
  });
  return (parsed.data ?? []).map((row) =>
    row.map((cell) => (cell ?? "").toString()),
  );
}

function buildColumnMap(
  headers: string[],
  bankConfig: BankConfig,
): ColumnMap {
  const { csvConfig } = bankConfig;
  return {
    date: findMatchingHeader(headers, [csvConfig.dateColumn, ...DATE_ALIASES]),
    merchant: findMatchingHeader(headers, [
      csvConfig.merchantColumn,
      ...MERCHANT_ALIASES,
    ]),
    amount: findMatchingHeader(headers, [
      csvConfig.amountColumn,
      ...AMOUNT_ALIASES,
    ]),
    debit: findMatchingHeader(headers, [csvConfig.debitColumn, ...DEBIT_ALIASES]),
    credit: findMatchingHeader(headers, [
      csvConfig.creditColumn,
      ...CREDIT_ALIASES,
    ]),
    balance: findMatchingHeader(headers, [
      csvConfig.balanceColumn,
      ...BALANCE_ALIASES,
    ]),
    reference: findMatchingHeader(headers, [
      csvConfig.referenceColumn,
      ...REFERENCE_ALIASES,
    ]),
  };
}

function columnMapIsUsable(map: ColumnMap): boolean {
  if (!map.date || !map.merchant) return false;
  return Boolean(map.amount || map.debit || map.credit);
}

function findHeaderRowIndex(
  rows: string[][],
  bankConfig: BankConfig,
): number {
  const configuredSkip = bankConfig.csvConfig.skipRows;
  if (
    configuredSkip >= 0 &&
    configuredSkip < rows.length &&
    rowLooksLikeHeader(rows[configuredSkip] ?? [])
  ) {
    return configuredSkip;
  }

  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i] ?? [];
    if (rowLooksLikeHeader(row)) return i;
    const map = buildColumnMap(row, bankConfig);
    if (columnMapIsUsable(map)) return i;
  }

  return configuredSkip < rows.length ? configuredSkip : 0;
}

function rowToRecord(headers: string[], cells: string[]): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  headers.forEach((header, index) => {
    const key = header.replace(/^\uFEFF/, "").trim() || `col_${index}`;
    record[key] = cells[index] ?? "";
  });
  return record;
}

/**
 * Parse CSV file using bank-specific configuration plus fuzzy headers.
 */
export async function parseCSV(
  fileContent: string,
  bankConfig: BankConfig,
): Promise<ParseResult> {
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];

  const stripped = stripBom(fileContent);
  const detectedDelimiter = detectDelimiter(stripped);
  const delimiter = detectedDelimiter || bankConfig.csvConfig.delimiter || ",";

  const rows = parseRows(stripped, delimiter);
  if (rows.length === 0) {
    return {
      transactions: [],
      errors: [
        {
          rowNumber: 0,
          errorType: "FILE_PARSING_ERROR",
          errorMessage: "CSV contained no rows",
          rawData: {},
        },
      ],
      totalRows: 0,
      successfulRows: 0,
    };
  }

  const headerIndex = findHeaderRowIndex(rows, bankConfig);
  const rawHeaders = (rows[headerIndex] ?? []).map((cell) =>
    cell.replace(/^\uFEFF/, "").trim(),
  );
  const columns = buildColumnMap(rawHeaders, bankConfig);

  if (!columnMapIsUsable(columns)) {
    return {
      transactions: [],
      errors: [
        {
          rowNumber: headerIndex + 1,
          errorType: "HEADER_MISMATCH",
          errorMessage: `Could not find date/merchant/amount columns. Headers: ${rawHeaders.join(", ") || "(empty)"}`,
          rawData: { headers: rawHeaders },
        },
      ],
      totalRows: rows.length,
      successfulRows: 0,
    };
  }

  const dataRows = rows.slice(headerIndex + 1);
  dataRows.forEach((cells, index) => {
    const rowNumber = headerIndex + index + 2;
    const record = rowToRecord(rawHeaders, cells);
    const isEmpty = cells.every((cell) => !cell || cell.trim() === "");
    if (isEmpty) return;

    try {
      const transaction = extractTransaction(record, columns, bankConfig);
      if (transaction) {
        transactions.push(transaction);
      }
    } catch (error) {
      errors.push({
        rowNumber,
        errorType: "PARSING_ERROR",
        errorMessage:
          error instanceof Error ? error.message : "Unknown error",
        rawData: record,
      });
    }
  });

  return {
    transactions,
    errors,
    totalRows: dataRows.length,
    successfulRows: transactions.length,
  };
}

function cellString(
  row: Record<string, unknown>,
  column: string | undefined,
): string {
  if (!column) return "";
  const value = row[column];
  if (value === undefined || value === null) return "";
  return value.toString().trim();
}

function extractTransaction(
  row: Record<string, unknown>,
  columns: ColumnMap,
  bankConfig: BankConfig,
): ParsedTransaction | null {
  const dateStr = cellString(row, columns.date);
  if (!dateStr) {
    throw new Error(`Missing date in column "${columns.date ?? "Date"}"`);
  }

  const date = parseDateFlexible(dateStr, bankConfig.csvConfig.dateFormat);
  if (!date) {
    throw new Error(
      `Invalid date format: "${dateStr}" (expected ${bankConfig.csvConfig.dateFormat} or a common variant)`,
    );
  }

  const merchant = cellString(row, columns.merchant);
  if (!merchant) {
    throw new Error(
      `Missing merchant in column "${columns.merchant ?? "Description"}"`,
    );
  }

  let amount: number;
  let type: "debit" | "credit";

  if (columns.amount && cellString(row, columns.amount) !== "") {
    const parsedAmount = parseAmount(cellString(row, columns.amount));
    type = parsedAmount < 0 ? "debit" : "credit";
    amount = Math.abs(parsedAmount);
    if (amount === 0 && (columns.debit || columns.credit)) {
      const debit = parseAmount(cellString(row, columns.debit));
      const credit = parseAmount(cellString(row, columns.credit));
      if (debit > 0) {
        amount = debit;
        type = "debit";
      } else if (credit > 0) {
        amount = credit;
        type = "credit";
      } else {
        throw new Error("Amount is zero or empty");
      }
    }
  } else if (columns.debit || columns.credit) {
    const debit = parseAmount(cellString(row, columns.debit));
    const credit = parseAmount(cellString(row, columns.credit));

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

  const balance = parseAmount(cellString(row, columns.balance));
  const reference = cellString(row, columns.reference) || undefined;

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

function toIsoDate(year: number, month: number, day: number): string | null {
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) {
    return null;
  }
  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return null;
  }
  if (year < 100) {
    year += year >= 70 ? 1900 : 2000;
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCDate() !== day ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCFullYear() !== year
  ) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseWithFormat(dateStr: string, format: string): string | null {
  const cleaned = dateStr.trim();
  let day: number;
  let month: number;
  let year: number;

  if (format === "DD/MM/YYYY" || format === "DD-MM-YYYY") {
    const parts = cleaned.split(/[/\-.]/);
    if (parts.length < 3) return null;
    day = parseInt(parts[0] ?? "", 10);
    month = parseInt(parts[1] ?? "", 10);
    year = parseInt(parts[2] ?? "", 10);
  } else if (format === "MM/DD/YYYY" || format === "MM-DD-YYYY") {
    const parts = cleaned.split(/[/\-.]/);
    if (parts.length < 3) return null;
    month = parseInt(parts[0] ?? "", 10);
    day = parseInt(parts[1] ?? "", 10);
    year = parseInt(parts[2] ?? "", 10);
  } else if (format === "YYYY-MM-DD" || format === "YYYY/MM/DD") {
    const parts = cleaned.split(/[/\-.]/);
    if (parts.length < 3) return null;
    year = parseInt(parts[0] ?? "", 10);
    month = parseInt(parts[1] ?? "", 10);
    day = parseInt(parts[2] ?? "", 10);
  } else if (format === "DD-MMM-YYYY" || format === "DD MMM YYYY") {
    const parts = cleaned.split(/[/\-\s]+/);
    if (parts.length < 3) return null;
    day = parseInt(parts[0] ?? "", 10);
    month = MONTHS[(parts[1] ?? "").toUpperCase().slice(0, 3)] ?? NaN;
    year = parseInt(parts[2] ?? "", 10);
  } else {
    return null;
  }

  return toIsoDate(year, month, day);
}

/**
 * Parse date string to ISO YYYY-MM-DD. Tries the bank's configured format
 * first, then common Nigerian / ISO variants (including datetimes).
 */
export function parseDateFlexible(
  dateStr: string,
  preferredFormat: string,
): string | null {
  if (!dateStr || dateStr.trim() === "") return null;

  const cleaned = dateStr.trim();
  const isoPrefix = cleaned.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix?.[1]) {
    const [year, month, day] = isoPrefix[1].split("-").map(Number);
    const iso = toIsoDate(year ?? NaN, month ?? NaN, day ?? NaN);
    if (iso) return iso;
  }

  const withoutTime = cleaned.split(/\s+/)[0] ?? cleaned;
  const formats = [
    preferredFormat,
    "DD/MM/YYYY",
    "DD-MM-YYYY",
    "YYYY-MM-DD",
    "MM/DD/YYYY",
    "DD-MMM-YYYY",
    "DD MMM YYYY",
  ];

  for (const format of formats) {
    const parsed = parseWithFormat(withoutTime, format);
    if (parsed) return parsed;
  }

  return null;
}

/**
 * Parse amount string to number with support for European formats (CRIT-003)
 */
export function parseAmount(amountStr: string | number | undefined): number {
  if (amountStr === undefined || amountStr === null || amountStr === "") {
    return 0;
  }

  if (typeof amountStr === "number") {
    return amountStr;
  }

  let cleaned = amountStr.toString().trim();

  const isNegative =
    cleaned.includes("(") || cleaned.toUpperCase().endsWith("CR");

  cleaned = cleaned
    .replace(/[()]/g, "")
    .replace(/\s*CR\s*$/i, "")
    .replace(/\s*DR\s*$/i, "");

  cleaned = cleaned.replace(/[₦$€£¥NGN]/gi, "").trim();

  if (!cleaned) {
    return 0;
  }

  if (/\d+\.?\d*[Ee][+-]?\d+/.test(cleaned)) {
    const amount = parseFloat(cleaned);
    if (!Number.isNaN(amount)) {
      return isNegative ? -Math.abs(amount) : amount;
    }
  }

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma > lastDot && lastComma > 0) {
    const afterComma = cleaned.substring(lastComma + 1);
    if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }

  const amount = parseFloat(cleaned);

  if (Number.isNaN(amount)) {
    throw new Error(`Invalid amount: "${amountStr}"`);
  }

  return isNegative ? -Math.abs(amount) : amount;
}
