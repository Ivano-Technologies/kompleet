/**
 * PDF Bank Statement Parser
 * Extracts transactions from PDF bank statements using pdf-parse + LLM
 * CRIT-005: Added OCR fallback for scanned/image-based PDFs
 */

import { PDFParse } from 'pdf-parse';
import OpenAI from 'openai';
import { createWorker } from 'tesseract.js';
import { ParsedTransaction, ParseResult, ParseError } from './csv-parser';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPEN_AI_API_KEY ||
      process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in environment variables.');
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

/**
 * Extract text using OCR for scanned/image-based PDFs
 * CRIT-005: OCR fallback implementation
 */
async function extractTextWithOCR(buffer: Buffer): Promise<string> {
  console.log('Attempting OCR extraction...');
  try {
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    console.log(`OCR extracted ${text.length} characters`);
    return text;
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return '';
  }
}

/**
 * Parse PDF bank statement — extracts text then uses LLM to structure transactions
 * CRIT-005: Enhanced with OCR fallback for scanned PDFs
 */
export async function parsePDF(
  fileBuffer: Buffer,
  bankName?: string
): Promise<ParseResult> {
  const errors: ParseError[] = [];

  try {
    // Step 1: Extract raw text from PDF
    const parser = new PDFParse({ data: fileBuffer });
    const textResult = await parser.getText();
    let rawText = textResult.text;
    await parser.destroy();

    // CRIT-005: If no text found or very little text, try OCR
    if (!rawText || rawText.trim().length < 50) {
      console.log('No text found in PDF, attempting OCR...');
      rawText = await extractTextWithOCR(fileBuffer);
    }

    if (!rawText || rawText.trim().length < 50) {
      return {
        transactions: [],
        errors: [
          {
            rowNumber: 0,
            errorType: 'EMPTY_PDF',
            errorMessage:
              'Could not extract text from PDF. File may be corrupted, password-protected, or require advanced OCR.',
            rawData: {},
          },
        ],
        totalRows: 0,
        successfulRows: 0,
      };
    }

    // Step 2: Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
    if (!apiKey) {
      // Fallback: try basic regex extraction without LLM
      const transactions = extractTransactionsWithRegex(rawText);
      return {
        transactions,
        errors:
          transactions.length === 0
            ? [
                {
                  rowNumber: 0,
                  errorType: 'NO_API_KEY',
                  errorMessage:
                    'PDF parsing requires an AI API key for accurate extraction. Please configure OPENAI_API_KEY.',
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
    const textChunks = chunkText(rawText, maxChunkSize);

    let allTransactions: ParsedTransaction[] = [];

    for (let chunkIdx = 0; chunkIdx < textChunks.length; chunkIdx++) {
      try {
        const chunkTransactions = await extractTransactionsWithLLM(
          textChunks[chunkIdx],
          bankName,
          chunkIdx,
          textChunks.length
        );
        allTransactions = allTransactions.concat(chunkTransactions);
      } catch (error) {
        errors.push({
          rowNumber: chunkIdx,
          errorType: 'LLM_EXTRACTION_ERROR',
          errorMessage: `Failed to extract transactions from chunk ${chunkIdx + 1}: ${
            error instanceof Error ? error.message : 'Unknown error'
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
    return {
      transactions: [],
      errors: [
        {
          rowNumber: 0,
          errorType: 'PDF_PARSE_ERROR',
          errorMessage:
            error instanceof Error ? error.message : 'Failed to parse PDF file',
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
  totalChunks: number
): Promise<ParsedTransaction[]> {
  const bankContext = bankName
    ? `This is a ${bankName} bank statement from Nigeria.`
    : 'This is a Nigerian bank statement.';

  const chunkContext =
    totalChunks > 1
      ? `This is chunk ${chunkIndex + 1} of ${totalChunks} from a multi-page statement.`
      : '';

  // HIGH-002: Use retry logic for LLM calls
  const completion = await callWithRetry(() =>
    getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
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
          role: 'user',
          content: `Extract all transactions from this bank statement text:

---
${text}
---

Return JSON: {"transactions": [{"date": "YYYY-MM-DD", "description": "merchant/narration", "amount": number, "type": "debit"|"credit", "balance": number, "reference": "ref or empty string"}]}`,
        },
      ],
      response_format: { type: 'json_object' },
    })
  );

  const content = completion.choices[0]?.message?.content || '{"transactions":[]}';
  const parsed = JSON.parse(content);

  if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
    return [];
  }

  return parsed.transactions
    .filter(
      (t: Record<string, unknown>) =>
        t.date && t.description && t.amount !== undefined
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
        i: number
      ) => ({
        date: normalizeDate(t.date),
        merchant: t.description || 'Unknown',
        amount: Math.abs(Number(t.amount) || 0),
        type: (t.type === 'credit' ? 'credit' : 'debit') as 'debit' | 'credit',
        balance: Number(t.balance) || 0,
        reference: t.reference || undefined,
        rawData: { source: 'pdf', extractionIndex: i, original: t },
      })
    );
}

/**
 * HIGH-002: Retry logic with exponential backoff for API calls
 */
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof OpenAI.APIError && error.status && error.status < 500) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
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

  const lines = text.split('\n');

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

    // Parse amounts
    const parsedAmounts = amounts.map((a) => parseFloat(a.replace(/,/g, '')));

    // Determine type from DR/CR suffix or amount position
    const isDR = /\bDR\b/i.test(trimmed);
    const isCR = /\bCR\b/i.test(trimmed);
    const type: 'debit' | 'credit' = isDR ? 'debit' : isCR ? 'credit' : 'debit';

    // First amount is typically the transaction amount, last is balance
    const amount = parsedAmounts[0];
    const balance = parsedAmounts.length > 1 ? parsedAmounts[parsedAmounts.length - 1] : 0;

    transactions.push({
      date,
      merchant: description,
      amount,
      type,
      balance,
      rawData: { source: 'pdf-regex', line: trimmed },
    });
  }

  return transactions;
}

/**
 * Normalize various date formats to YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';

  const cleaned = dateStr.trim();

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    let year = slashMatch[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // DD-Mon-YYYY (e.g., 15-Jan-2024)
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04',
    may: '05', jun: '06', jul: '07', aug: '08',
    sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const monMatch = cleaned.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
  if (monMatch) {
    const day = monMatch[1].padStart(2, '0');
    const month = monthNames[monMatch[2].toLowerCase()];
    let year = monMatch[3];
    if (year.length === 2) year = '20' + year;
    if (month) return `${year}-${month}-${day}`;
  }

  // Fallback: try Date.parse
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return '';
}

/**
 * Split long text into chunks for LLM processing, trying to break at page boundaries
 */
function chunkText(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push(remaining);
      break;
    }

    // Try to break at a page boundary or double newline
    let breakPoint = remaining.lastIndexOf('\n\n', maxSize);
    if (breakPoint < maxSize * 0.5) {
      breakPoint = remaining.lastIndexOf('\n', maxSize);
    }
    if (breakPoint < maxSize * 0.5) {
      breakPoint = maxSize;
    }

    chunks.push(remaining.substring(0, breakPoint));
    remaining = remaining.substring(breakPoint);
  }

  return chunks;
}

/**
 * Remove duplicate transactions that might appear in overlapping chunks
 */
function deduplicateExtracted(
  transactions: ParsedTransaction[]
): ParsedTransaction[] {
  const seen = new Set<string>();
  return transactions.filter((t) => {
    const key = `${t.date}-${t.amount}-${t.merchant.substring(0, 20)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
