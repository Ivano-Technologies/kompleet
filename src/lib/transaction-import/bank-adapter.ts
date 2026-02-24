/**
 * Bank Adapter Factory
 * Routes parsing to bank-specific adapters for 10 Nigerian banks
 */

import { getBankConfig, BANK_CONFIGS } from "./bank-configs";
import { parseCSV, ParseResult } from "./csv-parser";
import { parseExcel } from "./excel-parser";

export type FileType = "csv" | "excel" | "pdf";

/**
 * Parse bank statement file using appropriate adapter
 */
export async function parseBankStatement(
  fileContent: Buffer | string,
  bankCode: string,
  fileType: FileType,
): Promise<ParseResult> {
  if (fileType === "pdf") {
    const buffer = Buffer.isBuffer(fileContent)
      ? fileContent
      : Buffer.from(fileContent);
    const bankConfig = getBankConfig(bankCode);
    const { parsePDF } = await import("./pdf-parser");
    return parsePDF(buffer, bankConfig?.name);
  }

  const bankConfig = getBankConfig(bankCode);

  if (!bankConfig) {
    throw new Error(`Unsupported bank: ${bankCode}`);
  }

  if (fileType === "csv") {
    const content =
      typeof fileContent === "string"
        ? fileContent
        : fileContent.toString("utf-8");
    return parseCSV(content, bankConfig);
  } else if (fileType === "excel") {
    const buffer = Buffer.isBuffer(fileContent)
      ? fileContent
      : Buffer.from(fileContent);
    return parseExcel(buffer, bankConfig);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Detect file type from file extension or content
 */
export function detectFileType(fileName: string, mimeType?: string): FileType {
  const ext = fileName.toLowerCase().split(".").pop();

  if (ext === "csv") {
    return "csv";
  }

  if (ext === "xlsx" || ext === "xls") {
    return "excel";
  }

  if (ext === "pdf") {
    return "pdf";
  }

  // Fallback to MIME type
  if (mimeType) {
    if (mimeType.includes("csv") || mimeType.includes("text/plain")) {
      return "csv";
    }

    if (
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("xlsx")
    ) {
      return "excel";
    }

    if (mimeType.includes("pdf")) {
      return "pdf";
    }
  }

  throw new Error(`Cannot detect file type from: ${fileName}`);
}

/**
 * Get list of all supported banks
 */
export function getSupportedBanks() {
  return Object.values(BANK_CONFIGS).map((config) => ({
    code: config.code,
    name: config.name,
  }));
}

/**
 * Validate bank code
 */
export function isValidBankCode(bankCode: string): boolean {
  return bankCode.toUpperCase() in BANK_CONFIGS;
}
