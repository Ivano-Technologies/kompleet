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
  type TriageSnapshot,
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

export function isTransientConvexError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Server Error|OptimisticConcurrency|OCC|timed out|ECONNRESET|ETIMEDOUT|fetch failed/i.test(
    message,
  );
}

export async function withConvexRetry<T>(
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (!isTransientConvexError(error)) throw error;
    return await run();
  }
}

export type TriageActionBody =
  | {
      op: "categorise" | "confirm" | "ignore";
      kind: "transaction" | "duplicate";
      id: string;
      categoryId?: string;
    }
  | {
      op: "undo";
      snapshot: TriageSnapshot;
    }
  | {
      op: "ignore_low";
    };

type TransactionRow = {
  id: string;
  category_id?: string | null;
  confidence_score?: number | null;
  triage_ignored?: boolean;
  notes?: string | null;
};

function transactionSnapshot(row: TransactionRow): TriageSnapshot {
  return {
    kind: "transaction",
    id: row.id,
    categoryId: row.category_id ?? null,
    confidenceScore: row.confidence_score ?? null,
    triageIgnored: Boolean(row.triage_ignored),
    duplicateStatus: null,
    createdTransactionId: null,
  };
}

async function ignoreViaUpdate(
  convex: ConvexHttpClient,
  id: string,
  at: number,
): Promise<void> {
  try {
    await convex.mutation(api.transactions.updateMine, {
      externalId: id,
      triageIgnoredAt: at,
    });
  } catch (error) {
    if (!isMissingConvexFunction(error)) throw error;
    const row = (await convex.query(api.transactions.getMine, {
      externalId: id,
    })) as TransactionRow | null;
    const notes = [row?.notes, "__TRIAGE_IGNORED__"].filter(Boolean).join("\n");
    await convex.mutation(api.transactions.updateMine, {
      externalId: id,
      notes,
    });
  }
}

export async function applyTriageFallback(
  convex: ConvexHttpClient,
  body: TriageActionBody,
): Promise<{
  success: true;
  snapshot?: TriageSnapshot;
  snapshots?: TriageSnapshot[];
  createdTransactionId?: string | null;
  count?: number;
}> {
  if (body.op === "undo") {
    const { snapshot } = body;
    if (snapshot.kind === "duplicate") {
      if (snapshot.createdTransactionId) {
        await convex.mutation(api.transactions.removeMine, {
          externalIds: [snapshot.createdTransactionId],
        });
      }
      return { success: true };
    }
    await convex.mutation(api.transactions.updateMine, {
      externalId: snapshot.id,
      categoryExternalId: snapshot.categoryId,
      confidenceScore: snapshot.confidenceScore,
      triageIgnoredAt: snapshot.triageIgnored ? Date.now() : null,
    });
    return { success: true };
  }

  if (body.op === "ignore_low") {
    const ledger = await listAllTransactionsMine(convex);
    const snapshots: TriageSnapshot[] = [];
    const now = Date.now();
    for (const row of ledger.transactions as TransactionRow[]) {
      if (row.triage_ignored) continue;
      if (
        transactionTriageReason({
          categoryId: row.category_id,
          confidence_score: row.confidence_score,
        }) !== "low_confidence"
      ) {
        continue;
      }
      snapshots.push(transactionSnapshot(row));
      await ignoreViaUpdate(convex, row.id, now);
    }
    return { success: true, count: snapshots.length, snapshots };
  }

  if (body.kind === "duplicate") {
    const snapshot: TriageSnapshot = {
      kind: "duplicate",
      id: body.id,
      categoryId: null,
      confidenceScore: null,
      triageIgnored: false,
      duplicateStatus: "pending",
      createdTransactionId: null,
    };
    await convex.mutation(api.imports.resolveDuplicate, {
      externalId: body.id,
      action: body.op === "confirm" ? "kept_both" : "rejected",
    });
    return { success: true, snapshot, createdTransactionId: null };
  }

  const row = (await convex.query(api.transactions.getMine, {
    externalId: body.id,
  })) as TransactionRow | null;
  if (!row) throw new Error("Transaction not found");
  const snapshot = transactionSnapshot(row);

  if (body.op === "ignore") {
    await ignoreViaUpdate(convex, body.id, Date.now());
    return { success: true, snapshot, createdTransactionId: null };
  }

  if (body.op === "categorise") {
    if (!body.categoryId) throw new Error("Category is required");
    await convex.mutation(api.transactions.updateMine, {
      externalId: body.id,
      categoryExternalId: body.categoryId,
      confidenceScore: 100,
      triageIgnoredAt: null,
    });
    return { success: true, snapshot, createdTransactionId: null };
  }

  await convex.mutation(api.transactions.updateMine, {
    externalId: body.id,
    confidenceScore: 100,
    triageIgnoredAt: null,
  });
  return { success: true, snapshot, createdTransactionId: null };
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
