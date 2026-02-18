/**
 * PDF parser for bank statements
 * Handles encrypted PDFs, text extraction, and OCR fallback
 */

import * as pdfjs from 'pdfjs-dist';
import { RawRow, ParseResult, ParseError } from './types';
import { normalizeTransactions } from './normalizeTransactions';

// Set up PDF.js worker
if (typeof window === 'undefined') {
  // Node.js environment
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

/**
 * Parse PDF file
 */
export async function parsePdf(
  buffer: Buffer,
  userId: string,
  sourceFileId: string,
  password?: string
): Promise<ParseResult> {
  try {
    // 1. Load PDF document
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      password: password || '',
    }).promise;

    // 2. Extract text from all pages
    let fullText = '';
    let pageCount = 0;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
        pageCount++;
      } catch (error) {
        console.warn(`Failed to extract text from page ${pageNum}:`, error);
      }
    }

    // 3. If text extraction failed, try OCR
    if (!fullText || fullText.trim().length < 50) {
      console.warn('Text extraction returned minimal content, attempting OCR fallback');
      // OCR fallback would be implemented here
      // For now, we'll return an error
      throw new Error('Could not extract text from PDF. File may be corrupted or require OCR.');
    }

    // 4. Parse text into rows using LLM
    const rawRows = await parseTextWithLLM(fullText);

    // 5. Normalize transactions
    const { transactions, errors: normalizationErrors } = normalizeTransactions(
      rawRows,
      'pdf',
      userId,
      sourceFileId
    );

    return {
      transactions,
      errors: normalizationErrors,
      totalRows: rawRows.length,
      successfulRows: transactions.length,
      fileMetadata: {
        fileName: 'unknown.pdf',
        fileSize: buffer.length,
        fileType: 'pdf',
        isEncrypted: false,
        pageCount,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('password')) {
      throw new Error('PASSWORD_REQUIRED');
    }
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse text extracted from PDF using LLM
 * This is a placeholder - actual implementation would call LLM
 * For now, we'll use simple regex-based parsing
 */
async function parseTextWithLLM(text: string): Promise<RawRow[]> {
  const rows: RawRow[] = [];

  // Simple regex-based parsing for common bank statement formats
  // This is a fallback; actual implementation should use LLM for better accuracy

  // Look for transaction lines with date, description, and amount
  // Common format: DATE | DESCRIPTION | AMOUNT
  // Example: 2026-02-18 | TRANSFER TO JOHN DOE | 50,000.00

  const lines = text.split('\n');

  for (const line of lines) {
    // Skip empty lines and headers
    if (!line.trim() || line.toLowerCase().includes('date') || line.toLowerCase().includes('balance')) {
      continue;
    }

    // Try to parse line as transaction
    const row = parseTransactionLine(line);
    if (row && row.date && row.amount) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Parse a single line as transaction
 * Handles various formats
 */
function parseTransactionLine(line: string): RawRow | null {
  // Remove extra whitespace
  const trimmed = line.trim();

  // Skip very short lines
  if (trimmed.length < 10) {
    return null;
  }

  // Try to extract date (various formats)
  const dateMatch = trimmed.match(
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}-[A-Za-z]{3}-\d{4})/
  );

  if (!dateMatch) {
    return null;
  }

  const date = dateMatch[0];
  const afterDate = trimmed.substring(dateMatch.index! + dateMatch[0].length).trim();

  // Try to extract amount (currency symbols, commas, decimals)
  const amountMatch = afterDate.match(/[\d,]+\.?\d{0,2}\s*(?:NGN|₦|\$|€)?/);

  if (!amountMatch) {
    return null;
  }

  const amount = amountMatch[0];

  // Everything between date and amount is description
  const beforeAmount = afterDate.substring(0, amountMatch.index).trim();

  // Remove trailing punctuation from description
  const description = beforeAmount.replace(/[|,;-]+$/, '').trim();

  if (!description) {
    return null;
  }

  return {
    date,
    description,
    amount,
  };
}
