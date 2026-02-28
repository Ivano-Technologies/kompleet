/**
 * CSV parser for bank statements
 * Handles encoding detection, delimiter detection, and CSV parsing
 */

import { RawRow, ParseResult } from "./types";
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
    // 🔥 Dynamic imports
    const PapaModule = await import("papaparse");
    const chardetModule = await import("chardet");
    const iconvModule = await import("iconv-lite");

    const Papa = (PapaModule as any).default ?? PapaModule;
    const chardet = (chardetModule as any).default ?? chardetModule;
    const iconv = (iconvModule as any).default ?? iconvModule;

    // 1. Detect encoding
    const encoding = detectEncoding(buffer, chardet);

    // 2. Decode buffer
    const csvText = decodeBuffer(buffer, encoding, iconv);

    // 3. Detect delimiter
    const delimiter = detectDelimiter(csvText);

    // 4. Parse CSV
    const parseResult = Papa.parse(csvText, {
      delimiter,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header: string) => header.trim(),
    });

    const rawRows = (parseResult.data as Record<string, string>[])
      .filter((row) => Object.values(row).some((v) => v))
      .map((row) => normalizeRowFields(row));

    const { transactions, errors: normalizationErrors } =
      normalizeTransactions(
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
      `CSV parsing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Detect encoding
 */
function detectEncoding(buffer: Buffer, chardet: any): string {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    return "UTF-8";
  }

  try {
    const detected = chardet.detect(buffer);
    if (detected && detected !== "UTF-8") {
      return detected;
    }
  } catch {}

  return "UTF-8";
}

/**
 * Decode buffer
 */
function decodeBuffer(
  buffer: Buffer,
  encoding: string,
  iconv: any,
): string {
  try {
    let data = buffer;

    if (
      buffer.length >= 3 &&
      buffer[0] === 0xef &&
      buffer[1] === 0xbb &&
      buffer[2] === 0xbf
    ) {
      data = buffer.slice(3);
    }

    if (encoding.toUpperCase() === "UTF-8") {
      return data.toString("utf-8");
    }

    return iconv.decode(data, encoding);
  } catch {
    return buffer.toString("utf-8");
  }
}

/**
 * Detect delimiter
 */
function detectDelimiter(csvText: string): string {
  const lines = csvText.split("\n").slice(0, 3);
  const delimiters = [",", ";", "\t", "|"];

  let bestDelimiter = ",";
  let bestScore = 0;

  for (const delimiter of delimiters) {
    let score = 0;

    for (const line of lines) {
      const count = (line.match(new RegExp(`\\${delimiter}`, "g")) || [])
        .length;
      score += count;
    }

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Normalize row fields
 */
function normalizeRowFields(row: Record<string, string>): RawRow {
  const normalized: RawRow = {
    date: "",
    description: "",
    amount: "",
  };

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
    amount: [
      "amount",
      "debit",
      "credit",
      "value",
      "transaction amount",
      "amt",
    ],
  };

  for (const [standardField, aliases] of Object.entries(fieldMappings)) {
    for (const [key, value] of Object.entries(row)) {
      const lowerKey = key.toLowerCase().trim();
      if (aliases.some((alias) => lowerKey.includes(alias))) {
        normalized[standardField as keyof RawRow] = value;
        break;
      }
    }
  }

  const keys = Object.keys(row);

  if (!normalized.date && keys[0]) normalized.date = row[keys[0]] || "";
  if (!normalized.description && keys[1])
    normalized.description = row[keys[1]] || "";
  if (!normalized.amount && keys[2])
    normalized.amount = row[keys[2]] || "";

  return normalized;
}