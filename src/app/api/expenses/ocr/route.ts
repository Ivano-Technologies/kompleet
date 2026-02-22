/**
 * POST /api/expenses/ocr
 * Receipt OCR: accept base64 image, return extracted text and parsed fields (vendor, date, amount, vat).
 * Used by mobile app for server-side OCR fallback.
 */
import { NextRequest, NextResponse } from "next/server";
import { createWorker } from "tesseract.js";
import { logger } from "@/lib/logger";
import { parseReceiptText } from "@/lib/expense-ocr/parse-receipt-text";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const imageBase64 = body?.imageBase64 as string | undefined;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid imageBase64" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(imageBase64, "base64");
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "Invalid base64 image" },
        { status: 400 },
      );
    }

    const worker = await createWorker("eng");
    const {
      data: { text },
    } = await worker.recognize(buffer);
    await worker.terminate();

    const normalized = (text ?? "").replace(/\r\n/g, "\n").trim();
    const parsed = parseReceiptText(normalized);

    return NextResponse.json({
      text: normalized,
      vendor: parsed.vendor ?? null,
      date: parsed.date ?? null,
      amount: parsed.amount ?? null,
      vat: parsed.vat ?? null,
    });
  } catch (err) {
    logger.error("OCR error", {
      error: err instanceof Error ? err.message : String(err),
      operation: "expenses/ocr",
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "OCR failed" },
      { status: 500 },
    );
  }
}
