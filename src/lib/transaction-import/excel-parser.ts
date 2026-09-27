/**
 * Excel Parser Core
 * Handles .xlsx and .xls (including OLE Compound / JExcelAPI UBA exports).
 */

import * as XLSX from "xlsx";
import { BankConfig } from "./bank-configs";
import { parseTabularStatement, ParseError, ParseResult } from "./csv-parser";

function cellToString(cell: unknown): string {
  if (cell === undefined || cell === null) return "";
  if (cell instanceof Date && !Number.isNaN(cell.getTime())) {
    return cell.toISOString().slice(0, 10);
  }
  return cell.toString().trim();
}

function pickSheet(
  workbook: XLSX.WorkBook,
  bankConfig: BankConfig,
): XLSX.WorkSheet | undefined {
  const configured = bankConfig.excelConfig.sheetName;
  const configuredName =
    typeof configured === "string"
      ? configured
      : workbook.SheetNames[configured];
  if (configuredName && workbook.Sheets[configuredName]) {
    return workbook.Sheets[configuredName];
  }

  const preferred = workbook.SheetNames.find((name) =>
    /transaction|statement|history|optransaction/i.test(name),
  );
  if (preferred && workbook.Sheets[preferred]) {
    return workbook.Sheets[preferred];
  }

  const first = workbook.SheetNames[0];
  return first ? workbook.Sheets[first] : undefined;
}

/**
 * Parse Excel file using bank-specific configuration plus fuzzy headers.
 * @param password - Optional password for encrypted workbooks
 */
export async function parseExcel(
  fileBuffer: Buffer,
  bankConfig: BankConfig,
  password?: string,
): Promise<ParseResult> {
  try {
    const readOpts: XLSX.ParsingOptions = {
      type: "buffer",
      cellDates: true,
      cellNF: false,
      cellText: false,
    };
    if (password && password.trim()) {
      readOpts.password = password;
    }
    const workbook = XLSX.read(fileBuffer, readOpts);
    const worksheet = pickSheet(workbook, bankConfig);

    if (!worksheet) {
      const error: ParseError = {
        rowNumber: 0,
        errorType: "FILE_PARSING_ERROR",
        errorMessage: `Sheet not found: ${String(bankConfig.excelConfig.sheetName)}`,
        rawData: { sheets: workbook.SheetNames },
      };
      return {
        transactions: [],
        errors: [error],
        totalRows: 0,
        successfulRows: 0,
      };
    }

    const rows = (
      XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false,
        defval: "",
      }) as unknown[]
    ).map((row) =>
      Array.isArray(row) ? row.map((cell) => cellToString(cell)) : [],
    );

    return parseTabularStatement(rows, bankConfig);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (
      errMsg.toLowerCase().includes("password") ||
      errMsg.toLowerCase().includes("encrypted")
    ) {
      throw new Error("PASSWORD_REQUIRED");
    }

    return {
      transactions: [],
      errors: [
        {
          rowNumber: 0,
          errorType: "FILE_PARSING_ERROR",
          errorMessage: errMsg,
          rawData: {},
        },
      ],
      totalRows: 0,
      successfulRows: 0,
    };
  }
}
