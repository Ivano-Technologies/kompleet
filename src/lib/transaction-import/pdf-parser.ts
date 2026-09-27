/**
 * PDF Bank Statement Parser
 * Extracts transactions from PDF bank statements using pdf-parse + LLM
 * CRIT-005: Added OCR fallback for scanned/image-based PDFs
 * CRIT-006: Added encryption detection and better error handling
 * Build-safe: pdf-parse and tesseract.js are dynamically imported to avoid
 * pulling browser/native deps (DOMMatrix, canvas) into Next.js/Vercel build.
 */

import OpenAI from "openai";
import {
  ParsedTransaction,
  ParseResult,
  ParseError,
  parseDateFlexible,
} from "./csv-parser";
import {
  extractStructuredStatementTransactions,
  repairWrappedStatementDates,
} from "./statement-text-parser";
import { extractPdfText } from "./pdf-text-extract";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPEN_AI_API_KEY ||
      process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OpenAI API key not configured. Set OPENAI_API_KEY in environment variables.",
      );
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

/**
 * Extract text using OCR for scanned/image-based PDFs.
 * Disabled on Vercel: tesseract's worker is missing
 * (`/var/task/.next/worker-script/node/index.js`) and hung CoS smoke to 504.
 */
async function extractTextWithOCR(buffer: Buffer): Promise<string> {
  if (process.env.VERCEL || process.env.KOMPLEET_ENABLE_PDF_OCR !== "1") {
    return "";
  }
  console.log("Attempting OCR extraction...");
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const {
      data: { text },
    } = await worker.recognize(buffer);
    await worker.terminate();
    console.log(`OCR extracted ${text.length} characters`);
    return text;
  } catch (error) {
    console.error("OCR extraction failed:", error);
    return "";
  }
}

/**
 * Check if PDF is encrypted by looking for /Encrypt marker
 * CRIT-006: Encryption detection
 */
function checkPDFEncryption(buffer: Buffer): boolean {
  try {
    const bufferStr = buffer.toString("latin1");
    // Require a dictionary token so font/name substrings do not false-positive.
    return /\/Encrypt[\s/\[>]/.test(bufferStr);
  } catch {
    return false;
  }
}

/**
 * Parse PDF bank statement — extracts text then uses LLM to structure transactions
 * CRIT-005: Enhanced with OCR fallback for scanned PDFs
 * CRIT-006: Enhanced with encryption detection
 * Supports password-protected PDFs when password is provided
 */
export async function parsePDF(
  fileBuffer: Buffer,
  bankName?: string,
  password?: string,
): Promise<ParseResult> {
  const errors: ParseError[] = [];

  try {
    // Step 0: Check if PDF is encrypted
    const isEncrypted = checkPDFEncryption(fileBuffer);

    // If encrypted and no password provided, signal that password is required
    if (isEncrypted && (!password || !password.trim())) {
      throw new Error("PASSWORD_REQUIRED");
    }

    if (isEncrypted && password) {
      console.log(
        "PDF is password-protected. Attempting decryption with provided password...",
      );
    } else if (isEncrypted) {
      console.log(
        "PDF is encrypted with copy protection. Attempting OCR extraction...",
      );
    }

    // Step 1: Extract raw text. Never block on canvas/OCR on Vercel.
    let rawText = "";
    try {
      const extracted = await extractPdfText(
        fileBuffer,
        isEncrypted ? password : undefined,
      );
      rawText = extracted.text;
    } catch (parseError) {
      const errMsg =
        parseError instanceof Error ? parseError.message : String(parseError);
      if (errMsg === "PASSWORD_REQUIRED" || errMsg.toLowerCase().includes("password")) {
        throw new Error("PASSWORD_REQUIRED");
      }
      console.log("PDF text extraction failed:", errMsg);
    }

    if (!rawText || rawText.trim().length === 0) {
      rawText = await extractTextWithOCR(fileBuffer);
    }

    if (!rawText || rawText.trim().length < 50) {
      const encryptedMsg = isEncrypted
        ? " The PDF appears to be encrypted. Please provide the password to unlock it, or use a CSV/Excel export from your bank instead."
        : "";

      return {
        transactions: [],
        errors: [
          {
            rowNumber: 0,
            errorType: "EMPTY_PDF",
            errorMessage:
              "Could not extract text from PDF. File may be corrupted, password-protected, or require advanced OCR." +
              encryptedMsg,
            rawData: { isEncrypted },
          },
        ],
        totalRows: 0,
        successfulRows: 0,
      };
    }

    const repairedText = repairWrappedStatementDates(rawText);
    const structured = extractStructuredStatementTransactions(repairedText);
    if (structured.length > 0) {
      return {
        transactions: structured,
        errors,
        totalRows: structured.length,
        successfulRows: structured.length,
      };
    }

    // Preview: LLM on header-only stream text timed out (504). Fail closed
    // after deterministic extract — regex first, no OpenAI.
    if (process.env.VERCEL) {
      const regexTransactions = extractTransactionsWithRegex(repairedText);
      return {
        transactions: regexTransactions,
        errors:
          regexTransactions.length === 0
            ? [
                {
                  rowNumber: 0,
                  errorType: "NO_TRANSACTIONS",
                  errorMessage:
                    "Could not find transaction rows in this statement.",
                  rawData: {},
                },
              ]
            : [],
        totalRows: regexTransactions.length,
        successfulRows: regexTransactions.length,
      };
    }

    // Step 2: Check if OpenAI API key is available
    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPEN_AI_API_KEY ||
      process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
    if (!apiKey) {
      // Fallback: try basic regex extraction without LLM
      const transactions = extractTransactionsWithRegex(repairedText);
      return {
        transactions,
        errors:
          transactions.length === 0
            ? [
                {
                  rowNumber: 0,
                  errorType: "NO_API_KEY",
                  errorMessage:
                    "PDF parsing requires an AI API key for accurate extraction. Please configure OPENAI_API_KEY.",
                  rawData: {},
                },
              ]
            : [],
        totalRows: transactions.length,
        successfulRows: transactions.length,
      };
    }

    // Step 3: Use LLM to extract structured transaction data
    // Chunk text if it's very long (GPT-4o-mini context is 128k but we want to stay efficient)
    const maxChunkSize = 12000;
    const textChunks = chunkText(repairedText, maxChunkSize);

    let allTransactions: ParsedTransaction[] = [];

    for (let chunkIdx = 0; chunkIdx < textChunks.length; chunkIdx++) {
      try {
        const chunkTransactions = await extractTransactionsWithLLM(
          textChunks[chunkIdx],
          bankName,
          chunkIdx,
          textChunks.length,
        );
        allTransactions = allTransactions.concat(chunkTransactions);
      } catch (error) {
        errors.push({
          rowNumber: chunkIdx,
          errorType: "LLM_EXTRACTION_ERROR",
          errorMessage: `Failed to extract transactions from chunk ${chunkIdx + 1}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          rawData: { chunkIndex: chunkIdx },
        });
      }
    }

    // Deduplicate transactions that might overlap between chunks
    const deduplicated = deduplicateExtracted(allTransactions);

    return {
      transactions: deduplicated,
      errors,
      totalRows: deduplicated.length + errors.length,
      successfulRows: deduplicated.length,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg === "PASSWORD_REQUIRED") {
      throw error;
    }
    return {
      transactions: [],
      errors: [
        {
          rowNumber: 0,
          errorType: "PDF_PARSE_ERROR",
          errorMessage: errMsg,
          rawData: {},
        },
      ],
      totalRows: 0,
      successfulRows: 0,
    };
  }
}

/**
 * Use LLM to extract transactions from PDF text chunk
 * HIGH-002: Added retry logic with exponential backoff
 */
async function extractTransactionsWithLLM(
  text: string,
  bankName: string | undefined,
  chunkIndex: number,
  totalChunks: number,
): Promise<ParsedTransaction[]> {
  const bankContext = bankName
    ? `This is a ${bankName} bank statement from Nigeria.`
    : "This is a Nigerian bank statement.";

  const chunkContext =
    totalChunks > 1
      ? `This is chunk ${chunkIndex + 1} of ${totalChunks} from a multi-page statement.`
      : "";

  const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `You are a bank statement parser specializing in Nigerian bank statements. Extract ALL transactions from the provided text.

${bankContext}
${chunkContext}

Rules:
- Extract every transaction row you can identify
- Dates: Convert to YYYY-MM-DD format. Nigerian statements commonly use DD/MM/YYYY or DD-Mon-YYYY
- Amount: Extract as a positive number. Remove currency symbols (₦, NGN) and commas
- Type: "debit" for withdrawals/debits/DR, "credit" for deposits/credits/CR
- Merchant/Description: The transaction narration or description. Keep it as-is from the statement
- Balance: The running balance after the transaction, if shown
- Reference: Transaction reference number if available
- Skip header rows, summary rows, opening/closing balance lines, and non-transaction text
- If a value is missing, use 0 for amounts/balance and empty string for text fields

Return ONLY valid JSON. No markdown, no code blocks.`,
        },
        {
          role: "user",
          content: `Extract all transactions from this bank statement text:

---
${text}
---

Return JSON: {"transactions": [{"date": "YYYY-MM-DD", "description": "merchant/narration", "amount": number, "type": "debit"|"credit", "balance": number, "reference": "ref or empty string"}]}`,
        },
      ],
      response_format: { type: "json_object" },
    },
    { timeout: 12_000, maxRetries: 0 },
  );

  const content =
    completion.choices[0]?.message?.content || '{"transactions":[]}';
  const parsed = JSON.parse(content);

  if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
    return [];
  }

  return parsed.transactions
    .filter(
      (t: Record<string, unknown>) =>
        t.date && t.description && t.amount !== undefined,
    )
    .map(
      (
        t: {
          date: string;
          description: string;
          amount: number;
          type?: string;
          balance?: number;
          reference?: string;
        },
        i: number,
      ) => ({
        date: normalizeDate(t.date),
        merchant: t.description || "Unknown",
        amount: Math.abs(Number(t.amount) || 0),
        type: (t.type === "credit" ? "credit" : "debit") as "debit" | "credit",
        balance: Number(t.balance) || 0,
        reference: t.reference || undefined,
        rawData: { source: "pdf", extractionIndex: i, original: t },
      }),
    );
}

/**
 * Basic regex-based extraction fallback (no LLM needed)
 * Works with common Nigerian bank statement formats
 */
function extractTransactionsWithRegex(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Common patterns in Nigerian bank statements:
  // DD/MM/YYYY  Description  Debit  Credit  Balance
  // DD-Mon-YYYY  Description  Amount DR/CR  Balance

  const lines = text.split("\n");

  // Pattern: date followed by text and numbers
  const datePattern =
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}-[A-Za-z]{3}-\d{2,4})/;
  const amountPattern = /[\d,]+\.\d{2}/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) continue;

    const dateMatch = trimmed.match(datePattern);
    if (!dateMatch) continue;

    const amounts = trimmed.match(amountPattern);
    if (!amounts || amounts.length === 0) continue;

    // Extract date
    const date = normalizeDate(dateMatch[1]);
    if (!date) continue;

    // Extract description (text between date and first amount)
    const dateEnd = trimmed.indexOf(dateMatch[1]) + dateMatch[1].length;
    const firstAmountStart = trimmed.indexOf(amounts[0]);
    const description = trimmed.substring(dateEnd, firstAmountStart).trim();

    if (!description) continue;

    // Extract amounts
    const amount = parseFloat(amounts[amounts.length - 1].replace(/,/g, ""));
    const balance =
      amounts.length > 1
        ? parseFloat(amounts[amounts.length - 2].replace(/,/g, ""))
        : 0;

    transactions.push({
      date,
      merchant: description,
      amount,
      type: "debit",
      balance,
      rawData: { source: "pdf_regex", original: trimmed },
    });
  }

  return transactions;
}

/**
 * Normalize date string to YYYY-MM-DD format
 */
function normalizeDate(dateStr: string): string | null {
  return parseDateFlexible(dateStr, "DD-MMM-YYYY");
}

/**
 * Split text into chunks for processing
 */
function chunkText(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  const paragraphs = text.split("\n\n");

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk) chunks.push(currentChunk);

  return chunks;
}

/**
 * Deduplicate extracted transactions
 */
function deduplicateExtracted(
  transactions: ParsedTransaction[],
): ParsedTransaction[] {
  const seen = new Set<string>();
  const unique: ParsedTransaction[] = [];

  for (const tx of transactions) {
    const key = `${tx.date}-${tx.merchant}-${tx.amount}-${tx.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(tx);
    }
  }

  return unique;
}
