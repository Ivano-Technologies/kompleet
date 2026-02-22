/**
 * POST /api/expenses/ocr
 * Receipt OCR: accept base64 image, return extracted text and parsed fields (vendor, date, amount, vat).
 * Used by mobile app for server-side OCR fallback.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

const NGN_AMOUNT = /(?:₦|NGN|N)\s*([\d,]+(?:\.\d{2})?)/gi;
const DATE_DMY = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g;
const VAT_LIKE = /(?:VAT|vat|Tax)\s*(?:[:=]?\s*)?(?:₦|NGN)?\s*([\d,]+(?:\.\d{2})?)/gi;

function parseAmount(text: string): number | null {
  const matches = [...text.matchAll(NGN_AMOUNT)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1];
  const value = last[1]!.replace(/,/g, '');
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function parseDate(text: string): string | null {
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

function parseVendor(text: string): string | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const first = lines[0];
  if (first && first.length > 1 && first.length < 80) return first;
  return null;
}

function parseVat(text: string): number | null {
  const match = text.match(VAT_LIKE);
  if (!match) return null;
  const last = match[match.length - 1];
  const value = last?.replace(/,/g, '') ?? '';
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const imageBase64 = body?.imageBase64 as string | undefined;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid imageBase64' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(imageBase64, 'base64');
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: 'Invalid base64 image' },
        { status: 400 }
      );
    }

    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    const normalized = (text ?? '').replace(/\r\n/g, '\n').trim();
    const vendor = parseVendor(normalized);
    const date = parseDate(normalized);
    const amount = parseAmount(normalized);
    const vat = parseVat(normalized);

    return NextResponse.json({
      text: normalized,
      vendor: vendor ?? null,
      date: date ?? null,
      amount: amount ?? null,
      vat: vat ?? null,
    });
  } catch (err) {
    console.error('OCR error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'OCR failed' },
      { status: 500 }
    );
  }
}
