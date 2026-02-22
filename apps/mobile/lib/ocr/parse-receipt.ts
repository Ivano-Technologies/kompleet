/**
 * Parse receipt text (from OCR) into structured fields.
 * Nigerian context: ₦/NGN amounts, DD/MM/YYYY or DD-MM-YYYY dates.
 */

export interface ParsedReceipt {
  vendor: string | null;
  date: string | null; // YYYY-MM-DD
  amount: number | null;
  vatAmount: number | null;
  rawText: string;
}

const NGN_AMOUNT = /(?:₦|NGN|N)\s*([\d,]+(?:\.\d{2})?)/gi;
const DATE_DMY = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g;
const VAT_LIKE = /(?:VAT|vat|Tax)\s*(?:[:=]?\s*)?(?:₦|NGN)?\s*([\d,]+(?:\.\d{2})?)/gi;

function parseAmountFromText(text: string): number | null {
  const matches = [...text.matchAll(NGN_AMOUNT)];
  if (matches.length === 0) return null;
  // Prefer last match (often total at bottom)
  const last = matches[matches.length - 1];
  const value = last[1]!.replace(/,/g, '');
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function parseDateFromText(text: string): string | null {
  const match = text.match(DATE_DMY);
  if (!match) return null;
  const last = match[match.length - 1]!;
  const parts = last.split(/[\/\-]/);
  if (parts.length !== 3) return null;
  let d = parseInt(parts[0]!, 10);
  let m = parseInt(parts[1]!, 10);
  let y = parseInt(parts[2]!, 10);
  if (y < 100) y += 2000;
  if (d < 1 || d > 31 || m < 1 || m > 12) return null;
  const month = m < 10 ? `0${m}` : `${m}`;
  const day = d < 10 ? `0${d}` : `${d}`;
  return `${y}-${month}-${day}`;
}

function parseVendorFromText(text: string): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  // First non-empty line is often vendor/store name
  const first = lines[0];
  if (first && first.length > 1 && first.length < 80) return first;
  return null;
}

function parseVatFromText(text: string): number | null {
  const match = text.match(VAT_LIKE);
  if (!match) return null;
  const last = match[match.length - 1];
  const value = last?.replace(/,/g, '') ?? '';
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  return {
    vendor: parseVendorFromText(normalized),
    date: parseDateFromText(normalized),
    amount: parseAmountFromText(normalized),
    vatAmount: parseVatFromText(normalized),
    rawText: normalized,
  };
}
