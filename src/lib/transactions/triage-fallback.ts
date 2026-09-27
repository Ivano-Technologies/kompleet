import type { ConvexHttpClient } from "convex/browser";
import { api } from "@/lib/convex/http";
import { listAllTransactionsMine } from "@/lib/convex/money-lists";
import {
  suggestCategory,
  sumTriageCounts,
  transactionTriageReason,
  type TriageCategory,
  type TriageCounts,
  type TriageRow,
} from "@/lib/transactions/triage";

type CategoryRow = {
  id: string;
  name: string;
  keywords?: string[];
};

type DuplicatePayload = {
  id?: string;
  status?: string;
  new_transaction_data?: {
    date?: string;
    merchant?: string;
    description?: string;
    amount?: number;
    type?: "debit" | "credit";
    reference?: string;
  };
};

export function isMissingConvexFunction(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Could not find public function|listTriageMine|applyTriageMine|undoTriageMine|ignoreLowConfidenceMine|extra field `?(confidenceScore|triageIgnoredAt)/i.test(
    message,
  );
}

export async function listTriageFallback(
  convex: ConvexHttpClient,
  limit: number,
): Promise<{
  items: TriageRow[];
  counts: TriageCounts;
  categories: TriageCategory[];
}> {
  const [ledger, duplicates, categories] = await Promise.all([
    listAllTransactionsMine(convex),
    convex.query(api.imports.listDuplicates, { status: "pending" }),
    convex.query(api.categories.list, {}),
  ]);

  const categoryHints: CategoryRow[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    keywords: category.keywords,
  }));

  const items: TriageRow[] = [];
  let uncategorised = 0;
  let lowConfidence = 0;

  for (const row of ledger.transactions) {
    const notes = typeof row.notes === "string" ? row.notes : "";
    if (notes.includes("__TRIAGE_IGNORED__") || row.triage_ignored) continue;
    const reason = transactionTriageReason({
      categoryId: row.category_id,
      category: row.category,
      confidence_score: row.confidence_score,
    });
    if (!reason) continue;
    if (reason === "uncategorised") uncategorised += 1;
    else lowConfidence += 1;
    const category = row.category
      ? { id: row.category.id, name: row.category.name }
      : null;
    items.push({
      id: row.id,
      kind: "transaction",
      merchant: row.description,
      amount: row.amount,
      transactionType: row.transaction_type === "credit" ? "credit" : "debit",
      date: row.transaction_date,
      bankMeta: row.reference ?? row.source,
      reason,
      category,
      confidenceScore: row.confidence_score,
      suggestedCategory:
        suggestCategory(
          row.description,
          categoryHints,
          row.transaction_type === "credit" ? "credit" : "debit",
        ) ?? category,
    });
  }

  let duplicateSuspect = 0;
  for (const raw of duplicates) {
    const row = raw as DuplicatePayload;
    const data = row.new_transaction_data;
    if (!row.id || !data?.date || typeof data.amount !== "number") continue;
    const merchant = data.merchant || data.description;
    if (!merchant) continue;
    duplicateSuspect += 1;
    items.push({
      id: row.id,
      kind: "duplicate",
      merchant,
      amount: data.amount,
      transactionType: data.type === "credit" ? "credit" : "debit",
      date: data.date,
      bankMeta: data.reference ?? null,
      reason: "duplicate_suspect",
      category: null,
      confidenceScore: null,
      suggestedCategory: null,
    });
  }

  items.sort((a, b) => (a.date < b.date ? 1 : -1));
  const counts = sumTriageCounts({
    uncategorised,
    lowConfidence,
    duplicateSuspect,
  });

  return {
    items: items.slice(0, limit),
    counts,
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
    })),
  };
}
