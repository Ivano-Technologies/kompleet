/**
 * OCR queue: enqueue image path when offline; process when online (API + upload + expense).
 */
import * as FileSystem from "expo-file-system";
import { getDb } from "@/lib/db/init";
import { createExpense } from "@/lib/db/expense-repository";
import { parseReceiptText, type ParsedReceipt } from "./parse-receipt";

const OCR_QUEUE_TABLE = "ocr_queue";

export function enqueueOcr(imagePath: string): number {
  const db = getDb();
  db.runSync(`insert into ocr_queue (image_path) values (?)`, [imagePath]);
  const row = db.getAllSync<{ id: number }>("select last_insert_rowid() as id");
  return row[0]?.id ?? 0;
}

export function getPendingOcrItems(): { id: number; image_path: string }[] {
  const db = getDb();
  return db.getAllSync<{ id: number; image_path: string }>(
    "select id, image_path from ocr_queue where processed_at is null order by id",
  );
}

export function markOcrProcessed(id: number, expenseId: string): void {
  const db = getDb();
  db.runSync(
    'update ocr_queue set processed_at = datetime("now"), expense_id = ? where id = ?',
    [expenseId, id],
  );
}

export function markOcrFailed(id: number): void {
  const db = getDb();
  db.runSync(
    'update ocr_queue set processed_at = datetime("now") where id = ?',
    [id],
  );
}

export interface ProcessOcrResult {
  expenseId: string | null;
  error: string | null;
}

/**
 * Call server OCR API with image at path; parse response; create expense and return id.
 * Caller is responsible for uploading receipt to Storage and updating expense.receipt_url.
 */
export async function runOcrOnImage(
  imagePath: string,
  userId: string,
  apiBaseUrl: string,
  getAuthToken: () => Promise<string | null>,
): Promise<{ parsed: ParsedReceipt; expenseId: string } | { error: string }> {
  const base64 = await FileSystem.readAsStringAsync(imagePath, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const token = await getAuthToken();
  const res = await fetch(`${apiBaseUrl}/api/expenses/ocr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ imageBase64: base64 }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: text || `OCR API ${res.status}` };
  }
  const data = (await res.json()) as {
    text?: string;
    vendor?: string;
    date?: string;
    amount?: number;
    vat?: number;
  };
  const rawText = data.text ?? "";
  const parsed: ParsedReceipt = {
    vendor: data.vendor ?? null,
    date: data.date ?? null,
    amount: data.amount ?? null,
    vatAmount: data.vat ?? null,
    rawText,
  };
  const date = parsed.date ?? new Date().toISOString().slice(0, 10);
  const amount = parsed.amount ?? 0;
  const expense = createExpense(userId, {
    date,
    amount,
    currency: "NGN",
    vendor: parsed.vendor ?? undefined,
    vatAmount: parsed.vatAmount ?? undefined,
    notes: rawText.slice(0, 500),
  });
  return { parsed, expenseId: expense.id };
}

/**
 * Process all pending OCR queue items (call when back online).
 * Returns count processed and any errors.
 */
export async function processOcrQueue(
  userId: string,
  apiBaseUrl: string,
  getAuthToken: () => Promise<string | null>,
): Promise<{ processed: number; errors: string[] }> {
  const pending = getPendingOcrItems();
  const errors: string[] = [];
  let processed = 0;
  for (const item of pending) {
    try {
      const result = await runOcrOnImage(
        item.image_path,
        userId,
        apiBaseUrl,
        getAuthToken,
      );
      if ("error" in result) {
        errors.push(result.error);
        markOcrFailed(item.id);
      } else {
        markOcrProcessed(item.id, result.expenseId);
        processed++;
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
      markOcrFailed(item.id);
    }
  }
  return { processed, errors };
}

export type { ParsedReceipt };
