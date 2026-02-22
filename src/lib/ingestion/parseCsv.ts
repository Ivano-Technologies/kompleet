/**
 * CSV parser for bank statements
 * Handles encoding detection, delimiter detection, and CSV parsing
 */

import Papa from "papaparse";
import chardet from "chardet";
import iconv from "iconv-lite";
import { RawRow, ParseResult, ParseError } from "./types";
import { normalizeTransactions } from "./normalizeTransactions";

/**
 * Parse CSV file
 */
export async function parseCsv(
  buffer: Buffer,
  userId: string,
  sourceFileId: string,
): Promise<ParseResult> {
  try {
    // 1. Detect encoding
    const encoding = detectEncoding(buffer);

    // 2. Decode buffer to string
    const csvText = decodeBuffer(buffer, encoding);

    // 3. Auto-detect delimiter
    const delimiter = detectDelimiter(csvText);

    // 4. Parse CSV
    const parseResult = Papa.parse(csvText, {
      delimiter,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn("CSV parsing warnings:", parseResult.errors);
    }

    // 5. Extract rows and normalize field names
    const rawRows = (parseResult.data as Record<string, string>[])
      .filter((row) => Object.values(row).some((v) => v)) // Filter empty rows
      .map((row) => normalizeRowFields(row));

    // 6. Normalize transactions
    const { transactions, errors: normalizationErrors } = normalizeTransactions(
      rawRows,
      "csv",
      userId,
      sourceFileId,
    );

    return {
      transactions,
      errors: normalizationErrors,
      totalRows: parseResult.data.length,
      successfulRows: transactions.length,
      fileMetadata: {
        fileName: "unknown.csv",
        fileSize: buffer.length,
        fileType: "csv",
        isEncrypted: false,
      },
    };
  } catch (error) {
    throw new Error(
      `CSV parsing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Detect encoding of buffer
 * Supports: UTF-8, UTF-8 with BOM, Latin-1, Windows-1252
 */
function detectEncoding(buffer: Buffer): string {
  // Check for UTF-8 BOM
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    return "UTF-8";
  }

  // Use chardet for other encodings
  try {
    const detected = chardet.detect(buffer);
    if (detected && detected !== "UTF-8") {
      return detected;
    }
  } catch (error) {
    console.warn("Chardet detection failed:", error);
  }

  // Default to UTF-8
  return "UTF-8";
}

/**
 * Decode buffer to string using detected encoding
 */
function decodeBuffer(buffer: Buffer, encoding: string): string {
  try {
    // Remove BOM if present
    let data = buffer;
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xef &&
      buffer[1] === 0xbb &&
      buffer[2] === 0xbf
    ) {
      data = buffer.slice(3);
    }

    // Decode using iconv-lite
    if (encoding.toUpperCase() === "UTF-8") {
      return data.toString("utf-8");
    }

    return iconv.decode(data, encoding);
  } catch (error) {
    console.warn(
      `Decoding with ${encoding} failed, falling back to UTF-8:`,
      error,
    );
    return buffer.toString("utf-8");
  }
}

/**
 * Auto-detect CSV delimiter
 * Supports: comma, semicolon, tab, pipe
 */
function detectDelimiter(csvText: string): string {
  // Get first few lines
  const lines = csvText.split("\n").slice(0, 3);

  const delimiters = [",", ";", "\t", "|"];
  let bestDelimiter = ",";
  let bestScore = 0;

  for (const delimiter of delimiters) {
    let score = 0;

    for (const line of lines) {
      const count = (line.match(new RegExp(`\\${delimiter}`, "g")) || [])
        .length;
      if (count > 0) {
        score += count;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Normalize field names to standard transaction fields
 * Maps common bank statement column names to standard fields
 */
function normalizeRowFields(row: Record<string, string>): RawRow {
  const normalized: RawRow = {
    date: "",
    description: "",
    amount: "",
  };

  // Map common field names
  const fieldMappings = {
    date: [
      "date",
      "transaction date",
      "posting date",
      "value date",
      "tdate",
      "posted date",
    ],
    description: [
      "description",
      "narration",
      "details",
      "transaction details",
      "merchant",
      "payee",
      "reference",
    ],
    amount: ["amount", "debit", "credit", "value", "transaction amount", "amt"],
    type: ["type", "transaction type", "dr/cr", "debit/credit", "direction"],
    balance: [
      "balance",
      "running balance",
      "available balance",
      "account balance",
    ],
    reference: [
      "reference",
      "ref",
      "transaction ref",
      "cheque no",
      "check number",
    ],
  };

  // Try to match fields
  for (const [standardField, aliases] of Object.entries(fieldMappings)) {
    for (const [key, value] of Object.entries(row)) {
      const lowerKey = key.toLowerCase().trim();
      if (aliases.some((alias) => lowerKey.includes(alias))) {
        normalized[standardField as keyof RawRow] = value;
        break;
      }
    }
  }

  // If no match found, try to infer from position
  if (!normalized.date) {
    const keys = Object.keys(row);
    if (keys.length > 0) normalized.date = row[keys[0]] || "";
  }

  if (!normalized.description) {
    const keys = Object.keys(row);
    if (keys.length > 1) normalized.description = row[keys[1]] || "";
  }

  if (!normalized.amount) {
    const keys = Object.keys(row);
    if (keys.length > 2) normalized.amount = row[keys[2]] || "";
  }

  // Copy any extra fields
  for (const [key, value] of Object.entries(row)) {
    if (!Object.values(normalized).includes(value)) {
      normalized[key] = value;
    }
  }

  return normalized;
}
