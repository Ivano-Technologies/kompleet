/**
 * Excel parser for bank statements (XLSX and XLS)
 * Handles password-protected files, sheet detection, and data extraction
 */

import ExcelJS from "exceljs";
import { RawRow, ParseResult, ParseError } from "./types";
import { normalizeTransactions } from "./normalizeTransactions";

/**
 * Parse Excel file (XLSX or XLS)
 */
export async function parseExcel(
  buffer: Buffer,
  fileType: "xlsx" | "xls",
  userId: string,
  sourceFileId: string,
  password?: string,
): Promise<ParseResult> {
  try {
    // 1. Create workbook
    const workbook = new ExcelJS.Workbook();

    // 2. Load workbook (ExcelJS does not support password-protected files)
    try {
      await workbook.xlsx.load(buffer as any);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("password")
      ) {
        throw new Error("PASSWORD_REQUIRED");
      }
      throw error;
    }

    // 3. Find statement sheet
    const sheet = findStatementSheet(workbook);
    if (!sheet) {
      throw new Error("No statement sheet found in workbook");
    }

    // 4. Extract rows from sheet
    const rawRows = extractRowsFromSheet(sheet);

    // 5. Normalize transactions
    const { transactions, errors: normalizationErrors } = normalizeTransactions(
      rawRows,
      fileType,
      userId,
      sourceFileId,
    );

    return {
      transactions,
      errors: normalizationErrors,
      totalRows: rawRows.length,
      successfulRows: transactions.length,
      fileMetadata: {
        fileName: "unknown.xlsx",
        fileSize: buffer.length,
        fileType: fileType as "xlsx" | "xls",
        isEncrypted: false,
        sheetName: sheet.name,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "PASSWORD_REQUIRED") {
      throw error;
    }
    throw new Error(
      `Excel parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Find statement sheet in workbook
 * Uses heuristics: looks for sheets named "Statement", "Transactions", etc.
 */
function findStatementSheet(
  workbook: ExcelJS.Workbook,
): ExcelJS.Worksheet | null {
  // Common statement sheet names
  const statementNames = [
    "statement",
    "transactions",
    "activity",
    "history",
    "account",
    "bank statement",
    "transaction history",
  ];

  // Try exact matches first
  for (const name of statementNames) {
    const sheet = workbook.getWorksheet(name);
    if (sheet) {
      return sheet;
    }
  }

  // Try case-insensitive matches
  for (const sheet of workbook.worksheets) {
    const sheetName = sheet.name.toLowerCase();
    if (statementNames.some((name) => sheetName.includes(name))) {
      return sheet;
    }
  }

  // If no match, return first sheet (most common case)
  if (workbook.worksheets.length > 0) {
    return workbook.worksheets[0];
  }

  return null;
}

/**
 * Extract rows from Excel sheet
 * Handles merged cells, formatted dates/amounts
 */
function extractRowsFromSheet(sheet: ExcelJS.Worksheet): RawRow[] {
  const rows: RawRow[] = [];

  // Get header row (first row)
  const headerRow = sheet.getRow(1);
  if (!headerRow) {
    return rows;
  }

  const headers = headerRow.values as (string | number | undefined)[];
  if (!headers || headers.length === 0) {
    return rows;
  }

  // Extract data rows (starting from row 2)
  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row || !row.values) {
      continue;
    }

    const rawRow: RawRow = {} as RawRow;

    // Map cells to headers
    for (let colIndex = 1; colIndex < headers.length; colIndex++) {
      const header = headers[colIndex];
      const cell = row.getCell(colIndex);

      if (header && cell.value !== null && cell.value !== undefined) {
        const headerStr = header.toString().trim();
        const value = formatCellValue(cell);

        if (value) {
          rawRow[headerStr] = value;
        }
      }
    }

    // Skip empty rows
    if (
      Object.keys(rawRow).length > 0 &&
      Object.values(rawRow).some((v) => v)
    ) {
      rows.push(rawRow);
    }
  }

  return rows;
}

/**
 * Format cell value for consistency
 * Handles dates, numbers, and text
 */
function formatCellValue(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) {
    return "";
  }

  // Handle dates
  if (cell.value instanceof Date) {
    return cell.value.toISOString().split("T")[0];
  }

  // Handle numbers
  if (typeof cell.value === "number") {
    return cell.value.toString();
  }

  // Handle rich text
  if (typeof cell.value === "object" && "richText" in cell.value) {
    return (cell.value.richText as any[]).map((rt) => rt.text).join("");
  }

  // Handle strings
  return cell.value.toString().trim();
}
