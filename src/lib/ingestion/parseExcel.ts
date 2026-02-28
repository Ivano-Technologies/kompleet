/**
 * Excel parser for bank statements (XLSX and XLS)
 * Handles sheet detection and data extraction
 */

import { RawRow, ParseResult } from "./types";
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
    // 🔥 Dynamically import ExcelJS
    const ExcelJSModule = await import("exceljs");
    const ExcelJS =
      (ExcelJSModule as any).default ?? ExcelJSModule;

    const workbook = new ExcelJS.Workbook();

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

    const sheet = findStatementSheet(workbook);
    if (!sheet) {
      throw new Error("No statement sheet found in workbook");
    }

    const rawRows = extractRowsFromSheet(sheet);

    const { transactions, errors: normalizationErrors } =
      normalizeTransactions(
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
        fileType,
        isEncrypted: false,
        sheetName: sheet.name,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "PASSWORD_REQUIRED") {
      throw error;
    }

    throw new Error(
      `Excel parsing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Find statement sheet
 */
function findStatementSheet(workbook: any): any | null {
  const statementNames = [
    "statement",
    "transactions",
    "activity",
    "history",
    "account",
    "bank statement",
    "transaction history",
  ];

  for (const name of statementNames) {
    const sheet = workbook.getWorksheet(name);
    if (sheet) return sheet;
  }

  for (const sheet of workbook.worksheets) {
    const sheetName = sheet.name.toLowerCase();
    if (statementNames.some((name) => sheetName.includes(name))) {
      return sheet;
    }
  }

  if (workbook.worksheets.length > 0) {
    return workbook.worksheets[0];
  }

  return null;
}

/**
 * Extract rows
 */
function extractRowsFromSheet(sheet: any): RawRow[] {
  const rows: RawRow[] = [];

  const headerRow = sheet.getRow(1);
  if (!headerRow) return rows;

  const headers = headerRow.values as (string | number | undefined)[];
  if (!headers || headers.length === 0) return rows;

  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex++) {
    const row = sheet.getRow(rowIndex);
    if (!row || !row.values) continue;

    const rawRow: RawRow = {} as RawRow;

    for (let colIndex = 1; colIndex < headers.length; colIndex++) {
      const header = headers[colIndex];
      const cell = row.getCell(colIndex);

      if (header && cell.value !== null && cell.value !== undefined) {
        const headerStr = header.toString().trim();
        const value = formatCellValue(cell);
        if (value) rawRow[headerStr] = value;
      }
    }

    if (
      Object.keys(rawRow).length > 0 &&
      Object.values(rawRow).some((v) => v)
    ) {
      rows.push(rawRow);
    }
  }

  return rows;
}

function formatCellValue(cell: any): string {
  if (cell.value === null || cell.value === undefined) return "";

  if (cell.value instanceof Date) {
    return cell.value.toISOString().split("T")[0];
  }

  if (typeof cell.value === "number") {
    return cell.value.toString();
  }

  if (typeof cell.value === "object" && "richText" in cell.value) {
    return (cell.value.richText as any[])
      .map((rt) => rt.text)
      .join("");
  }

  return cell.value.toString().trim();
}