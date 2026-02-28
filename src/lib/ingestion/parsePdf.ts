/**
 * PDF parser for bank statements
 * Handles encrypted PDFs and text extraction
 */

import { RawRow, ParseResult } from "./types";
import { normalizeTransactions } from "./normalizeTransactions";

/**
 * Parse PDF file
 */
export async function parsePdf(
  buffer: Buffer,
  userId: string,
  sourceFileId: string,
  password?: string,
): Promise<ParseResult> {
  void password;

  try {
    // 🔥 Dynamically import pdf-parse
    const pdfParseModule = await import("pdf-parse");

    // Some versions export default, some named — handle safely
    const pdfParse =
      (pdfParseModule as any).default ?? (pdfParseModule as any);

    // Extract text
    const result = await pdfParse(buffer);

    const fullText =
      typeof result?.text === "string" ? result.text : "";

    const pageCount =
      typeof result?.numpages === "number" ? result.numpages : 0;

    if (!fullText || fullText.trim().length < 50) {
      throw new Error(
        "Could not extract text from PDF. File may be corrupted or require OCR.",
      );
    }

    // Parse text
    const rawRows = await parseTextWithLLM(fullText);

    const { transactions, errors: normalizationErrors } =
      normalizeTransactions(
        rawRows,
        "pdf",
        userId,
        sourceFileId,
      );

    return {
      transactions,
      errors: normalizationErrors,
      totalRows: rawRows.length,
      successfulRows: transactions.length,
      fileMetadata: {
        fileName: "unknown.pdf",
        fileSize: buffer.length,
        fileType: "pdf",
        isEncrypted: false,
        pageCount,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("password")) {
      throw new Error("PASSWORD_REQUIRED");
    }

    throw new Error(
      `PDF parsing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Parse text extracted from PDF
 */
async function parseTextWithLLM(text: string): Promise<RawRow[]> {
  const rows: RawRow[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    if (
      !line.trim() ||
      line.toLowerCase().includes("date") ||
      line.toLowerCase().includes("balance")
    ) {
      continue;
    }

    const row = parseTransactionLine(line);
    if (row && row.date && row.amount) {
      rows.push(row);
    }
  }

  return rows;
}

function parseTransactionLine(line: string): RawRow | null {
  const trimmed = line.trim();

  if (trimmed.length < 10) return null;

  const dateMatch = trimmed.match(
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}-[A-Za-z]{3}-\d{4})/,
  );

  if (!dateMatch) return null;

  const date = dateMatch[0];
  const afterDate = trimmed
    .substring(dateMatch.index! + dateMatch[0].length)
    .trim();

  const amountMatch = afterDate.match(
    /[\d,]+\.?\d{0,2}\s*(?:NGN|₦|\$|€)?/,
  );

  if (!amountMatch) return null;

  const amount = amountMatch[0];
  const beforeAmount = afterDate
    .substring(0, amountMatch.index)
    .trim();

  const description = beforeAmount
    .replace(/[|,;-]+$/, "")
    .trim();

  if (!description) return null;

  return {
    date,
    description,
    amount,
  };
}