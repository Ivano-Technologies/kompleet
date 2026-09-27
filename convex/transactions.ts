import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { newExternalId, toMs } from "./lib/ids";
import { transactionTriageReason } from "./lib/triage";

const categoryEmbed = v.union(
  v.object({
    id: v.string(),
    name: v.string(),
    category_type: v.string(),
    tax_treatment: v.string(),
  }),
  v.null(),
);

const transactionApi = v.object({
  id: v.string(),
  user_id: v.string(),
  transaction_date: v.string(),
  description: v.string(),
  amount: v.number(),
  transaction_type: v.string(),
  balance: v.union(v.number(), v.null()),
  category_id: v.union(v.string(), v.null()),
  confidence_score: v.union(v.number(), v.null()),
  source: v.union(v.string(), v.null()),
  reference: v.union(v.string(), v.null()),
  notes: v.union(v.string(), v.null()),
  is_reconciled: v.boolean(),
  triage_ignored: v.boolean(),
  created_at: v.string(),
  updated_at: v.string(),
  category: categoryEmbed,
});

const triageCategory = v.union(
  v.object({
    id: v.string(),
    name: v.string(),
  }),
  v.null(),
);

const triageRow = v.object({
  id: v.string(),
  kind: v.union(v.literal("transaction"), v.literal("duplicate")),
  merchant: v.string(),
  amount: v.number(),
  transaction_type: v.union(v.literal("debit"), v.literal("credit")),
  date: v.string(),
  bank_meta: v.union(v.string(), v.null()),
  reason: v.union(
    v.literal("uncategorised"),
    v.literal("low_confidence"),
    v.literal("duplicate_suspect"),
  ),
  category: triageCategory,
  confidence_score: v.union(v.number(), v.null()),
});

const triageCounts = v.object({
  needsCheck: v.number(),
  uncategorised: v.number(),
  lowConfidence: v.number(),
  duplicateSuspect: v.number(),
});

const triageSnapshot = v.object({
  kind: v.union(v.literal("transaction"), v.literal("duplicate")),
  id: v.string(),
  categoryId: v.union(v.string(), v.null()),
  confidenceScore: v.union(v.number(), v.null()),
  triageIgnored: v.boolean(),
  duplicateStatus: v.union(v.string(), v.null()),
  createdTransactionId: v.union(v.string(), v.null()),
});

async function embedCategory(
  ctx: { db: { get: (id: import("./_generated/dataModel").Id<"categories">) => Promise<{ externalId: string; name: string; categoryType: string; taxTreatment: string } | null> } },
  categoryId: import("./_generated/dataModel").Id<"categories"> | undefined,
) {
  if (!categoryId) return null;
  const cat = await ctx.db.get(categoryId);
  if (!cat) return null;
  return {
    id: cat.externalId,
    name: cat.name,
    category_type: cat.categoryType,
    tax_treatment: cat.taxTreatment,
  };
}

async function toApi(
  ctx: Parameters<typeof embedCategory>[0],
  row: {
    externalId: string;
    userExternalId: string;
    transactionDate: string;
    description: string;
    amount: number;
    transactionType: "debit" | "credit";
    balance?: number;
    categoryId?: import("./_generated/dataModel").Id<"categories">;
    categoryExternalId?: string;
    confidenceScore?: number;
    source?: string;
    reference?: string;
    notes?: string;
    isReconciled: boolean;
    triageIgnoredAt?: number;
    createdAt: number;
    updatedAt: number;
  },
) {
  return {
    id: row.externalId,
    user_id: row.userExternalId,
    transaction_date: row.transactionDate,
    description: row.description,
    amount: row.amount,
    transaction_type: row.transactionType,
    balance: row.balance ?? null,
    category_id: row.categoryExternalId ?? null,
    confidence_score: row.confidenceScore ?? null,
    source: row.source ?? null,
    reference: row.reference ?? null,
    notes: row.notes ?? null,
    is_reconciled: row.isReconciled,
    triage_ignored: Boolean(row.triageIgnoredAt),
    created_at: new Date(row.createdAt).toISOString(),
    updated_at: new Date(row.updatedAt).toISOString(),
    category: await embedCategory(ctx, row.categoryId),
  };
}

export const listMine = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    type: v.optional(v.union(v.literal("debit"), v.literal("credit"))),
    search: v.optional(v.string()),
    page: v.number(),
    limit: v.number(),
  },
  returns: v.object({
    transactions: v.array(transactionApi),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let filtered = rows;
    if (args.startDate) {
      filtered = filtered.filter((r) => r.transactionDate >= args.startDate!);
    }
    if (args.endDate) {
      filtered = filtered.filter((r) => r.transactionDate <= args.endDate!);
    }
    if (args.categoryId) {
      filtered = filtered.filter(
        (r) => r.categoryExternalId === args.categoryId,
      );
    }
    if (args.type) {
      filtered = filtered.filter((r) => r.transactionType === args.type);
    }
    if (args.search) {
      const needle = args.search.toLowerCase();
      filtered = filtered.filter((r) =>
        r.description.toLowerCase().includes(needle),
      );
    }
    filtered.sort((a, b) => {
      if (a.transactionDate !== b.transactionDate) {
        return a.transactionDate < b.transactionDate ? 1 : -1;
      }
      return b.createdAt - a.createdAt;
    });
    const total = filtered.length;
    const start = (args.page - 1) * args.limit;
    const page = filtered.slice(start, start + args.limit);
    const transactions = [];
    for (const row of page) {
      transactions.push(await toApi(ctx, row));
    }
    return { transactions, total };
  },
});

export const getMine = query({
  args: { externalId: v.string() },
  returns: v.union(transactionApi, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("transactions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) return null;
    return await toApi(ctx, row);
  },
});

export const totalsForYear = query({
  args: { taxYear: v.number() },
  returns: v.object({
    income: v.number(),
    expenses: v.number(),
    count: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const yearPrefix = String(args.taxYear);
    const inYear = rows.filter((r) => r.transactionDate.startsWith(yearPrefix));
    let income = 0;
    let expenses = 0;
    for (const row of inYear) {
      if (row.transactionType === "credit") income += row.amount;
      else expenses += row.amount;
    }
    return { income, expenses, count: inYear.length };
  },
});

export const summaryForPeriod = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  returns: v.object({
    income: v.number(),
    expenses: v.number(),
    count: v.number(),
    uncategorized: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const inPeriod = rows.filter(
      (row) =>
        row.transactionDate >= args.startDate &&
        row.transactionDate <= args.endDate,
    );
    let income = 0;
    let expenses = 0;
    let uncategorized = 0;
    for (const row of inPeriod) {
      if (row.transactionType === "credit") income += row.amount;
      else expenses += row.amount;
      if (!row.categoryId) {
        uncategorized += 1;
      } else if (
        typeof row.confidenceScore === "number" &&
        row.confidenceScore < 80
      ) {
        uncategorized += 1;
      }
    }
    return { income, expenses, count: inPeriod.length, uncategorized };
  },
});

export const monthlyTotals = query({
  args: { months: v.number() },
  returns: v.array(
    v.object({
      month: v.string(),
      income: v.number(),
      expenses: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const now = new Date();
    const buckets: { month: string; income: number; expenses: number }[] = [];
    for (let i = args.months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.push({ month: key, income: 0, expenses: 0 });
    }
    const index = new Map(buckets.map((b, i) => [b.month, i]));
    for (const row of rows) {
      const key = row.transactionDate.slice(0, 7);
      const i = index.get(key);
      if (i === undefined) continue;
      const bucket = buckets[i];
      if (!bucket) continue;
      if (row.transactionType === "credit") bucket.income += row.amount;
      else bucket.expenses += row.amount;
    }
    return buckets;
  },
});

export const createMine = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    transactionType: v.union(v.literal("debit"), v.literal("credit")),
    transactionDate: v.string(),
    categoryExternalId: v.optional(v.string()),
    balance: v.optional(v.number()),
    source: v.optional(v.string()),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    confidenceScore: v.optional(v.number()),
    externalId: v.optional(v.string()),
  },
  returns: transactionApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    let categoryId: import("./_generated/dataModel").Id<"categories"> | undefined;
    if (args.categoryExternalId) {
      const cat = await ctx.db
        .query("categories")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", args.categoryExternalId!),
        )
        .unique();
      categoryId = cat?._id;
    }
    const now = Date.now();
    const externalId = args.externalId ?? newExternalId();
    await ctx.db.insert("transactions", {
      externalId,
      userId: user._id,
      userExternalId: user.externalId,
      transactionDate: args.transactionDate,
      description: args.description,
      amount: args.amount,
      transactionType: args.transactionType,
      balance: args.balance,
      categoryId,
      categoryExternalId: args.categoryExternalId,
      confidenceScore: args.confidenceScore,
      source: args.source,
      reference: args.reference,
      notes: args.notes,
      isReconciled: false,
      createdAt: now,
      updatedAt: now,
    });
    const row = await ctx.db
      .query("transactions")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    if (!row) throw new Error("Transaction not found");
    return await toApi(ctx, row);
  },
});

export const createManyMine = mutation({
  args: {
    items: v.array(
      v.object({
        description: v.string(),
        amount: v.number(),
        transactionType: v.union(v.literal("debit"), v.literal("credit")),
        transactionDate: v.string(),
        balance: v.optional(v.number()),
        source: v.optional(v.string()),
        reference: v.optional(v.string()),
      }),
    ),
  },
  returns: v.array(transactionApi),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    const created = [];
    for (const item of args.items) {
      const externalId = newExternalId();
      await ctx.db.insert("transactions", {
        externalId,
        userId: user._id,
        userExternalId: user.externalId,
        transactionDate: item.transactionDate,
        description: item.description,
        amount: item.amount,
        transactionType: item.transactionType,
        balance: item.balance,
        source: item.source,
        reference: item.reference,
        isReconciled: false,
        createdAt: now,
        updatedAt: now,
      });
      const row = await ctx.db
        .query("transactions")
        .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
        .unique();
      if (row) created.push(await toApi(ctx, row));
    }
    return created;
  },
});

export const updateMine = mutation({
  args: {
    externalId: v.string(),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    transactionType: v.optional(
      v.union(v.literal("debit"), v.literal("credit")),
    ),
    transactionDate: v.optional(v.string()),
    categoryExternalId: v.optional(v.union(v.string(), v.null())),
    notes: v.optional(v.string()),
    isReconciled: v.optional(v.boolean()),
    confidenceScore: v.optional(v.union(v.number(), v.null())),
    triageIgnoredAt: v.optional(v.union(v.number(), v.null())),
  },
  returns: transactionApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("transactions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) {
      throw new Error("Transaction not found");
    }
    let categoryId = row.categoryId;
    let categoryExternalId = row.categoryExternalId;
    if (args.categoryExternalId === null) {
      categoryId = undefined;
      categoryExternalId = undefined;
    } else if (args.categoryExternalId) {
      const cat = await ctx.db
        .query("categories")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", args.categoryExternalId as string),
        )
        .unique();
      categoryId = cat?._id;
      categoryExternalId = args.categoryExternalId;
    }
    const confidenceScore =
      args.confidenceScore === null
        ? undefined
        : (args.confidenceScore ?? row.confidenceScore);
    const triageIgnoredAt =
      args.triageIgnoredAt === null
        ? undefined
        : (args.triageIgnoredAt ?? row.triageIgnoredAt);
    await ctx.db.patch(row._id, {
      description: args.description ?? row.description,
      amount: args.amount ?? row.amount,
      transactionType: args.transactionType ?? row.transactionType,
      transactionDate: args.transactionDate ?? row.transactionDate,
      categoryId,
      categoryExternalId,
      notes: args.notes ?? row.notes,
      isReconciled: args.isReconciled ?? row.isReconciled,
      confidenceScore,
      triageIgnoredAt,
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Transaction not found");
    return await toApi(ctx, updated);
  },
});

export const removeMine = mutation({
  args: { externalIds: v.array(v.string()) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    let removed = 0;
    for (const externalId of args.externalIds) {
      const row = await ctx.db
        .query("transactions")
        .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
        .unique();
      if (row && row.userId === user._id) {
        await ctx.db.delete(row._id);
        removed += 1;
      }
    }
    return removed;
  },
});

export const upsertFromBackfill = internalMutation({
  args: {
    externalId: v.string(),
    userExternalId: v.string(),
    transactionDate: v.string(),
    description: v.string(),
    amount: v.number(),
    transactionType: v.union(v.literal("debit"), v.literal("credit")),
    balance: v.optional(v.number()),
    categoryExternalId: v.optional(v.string()),
    confidenceScore: v.optional(v.number()),
    source: v.optional(v.string()),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    isReconciled: v.optional(v.boolean()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.userExternalId))
      .unique();
    if (!user) {
      throw new Error(`User ${args.userExternalId} not found; backfill users first`);
    }
    let categoryId: import("./_generated/dataModel").Id<"categories"> | undefined;
    if (args.categoryExternalId) {
      const cat = await ctx.db
        .query("categories")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", args.categoryExternalId!),
        )
        .unique();
      categoryId = cat?._id;
    }
    const existing = await ctx.db
      .query("transactions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    const now = Date.now();
    const fields = {
      userId: user._id,
      userExternalId: user.externalId,
      transactionDate: args.transactionDate,
      description: args.description,
      amount: args.amount,
      transactionType: args.transactionType,
      balance: args.balance,
      categoryId,
      categoryExternalId: args.categoryExternalId,
      confidenceScore: args.confidenceScore,
      source: args.source,
      reference: args.reference,
      notes: args.notes,
      isReconciled: args.isReconciled ?? false,
      createdAt: toMs(args.createdAt) ?? now,
      updatedAt: toMs(args.updatedAt) ?? now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing.externalId;
    }
    await ctx.db.insert("transactions", {
      externalId: args.externalId,
      ...fields,
    });
    return args.externalId;
  },
});

function duplicatePayloadFields(payload: unknown): {
  merchant: string;
  amount: number;
  date: string;
  transactionType: "debit" | "credit";
  bankMeta: string | null;
} | null {
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const data =
    typeof record.new_transaction_data === "object" &&
    record.new_transaction_data !== null
      ? (record.new_transaction_data as Record<string, unknown>)
      : record;
  const merchant =
    typeof data.merchant === "string"
      ? data.merchant
      : typeof data.description === "string"
        ? data.description
        : "";
  const amount = typeof data.amount === "number" ? data.amount : NaN;
  const date =
    typeof data.date === "string"
      ? data.date
      : typeof data.transaction_date === "string"
        ? data.transaction_date
        : "";
  if (!merchant || !date || Number.isNaN(amount)) return null;
  return {
    merchant,
    amount,
    date,
    transactionType: data.type === "credit" ? "credit" : "debit",
    bankMeta:
      typeof data.reference === "string"
        ? data.reference
        : typeof data.narration === "string"
          ? data.narration
          : null,
  };
}

async function collectTriage(ctx: QueryCtx | MutationCtx) {
  const user = await getCurrentUser(ctx);
  const rows = await ctx.db
    .query("transactions")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  const duplicates = await ctx.db
    .query("duplicateCandidates")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();

  const items: Array<{
    id: string;
    kind: "transaction" | "duplicate";
    merchant: string;
    amount: number;
    transaction_type: "debit" | "credit";
    date: string;
    bank_meta: string | null;
    reason: "uncategorised" | "low_confidence" | "duplicate_suspect";
    category: { id: string; name: string } | null;
    confidence_score: number | null;
    sortAt: number;
  }> = [];

  let uncategorised = 0;
  let lowConfidence = 0;
  for (const row of rows) {
    const reason = transactionTriageReason(row);
    if (!reason) continue;
    if (reason === "uncategorised") uncategorised += 1;
    else lowConfidence += 1;
    const category = row.categoryId ? await embedCategory(ctx, row.categoryId) : null;
    items.push({
      id: row.externalId,
      kind: "transaction",
      merchant: row.description ?? "",
      amount: row.amount ?? 0,
      transaction_type: row.transactionType ?? "debit",
      date: row.transactionDate ?? "",
      bank_meta: row.reference ?? row.source ?? null,
      reason,
      category: category ? { id: category.id, name: category.name } : null,
      confidence_score: row.confidenceScore ?? null,
      sortAt: row.createdAt,
    });
  }

  let duplicateSuspect = 0;
  for (const row of duplicates) {
    if ((row.status ?? "pending") !== "pending") continue;
    const fields = duplicatePayloadFields(row.payload);
    if (!fields) continue;
    duplicateSuspect += 1;
    items.push({
      id: row.externalId,
      kind: "duplicate",
      merchant: fields.merchant,
      amount: fields.amount,
      transaction_type: fields.transactionType,
      date: fields.date,
      bank_meta: fields.bankMeta,
      reason: "duplicate_suspect",
      category: null,
      confidence_score: null,
      sortAt: row.createdAt,
    });
  }

  items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.sortAt - a.sortAt;
  });

  return {
    items,
    counts: {
      needsCheck: uncategorised + lowConfidence + duplicateSuspect,
      uncategorised,
      lowConfidence,
      duplicateSuspect,
    },
  };
}

export const listTriageMine = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    items: v.array(triageRow),
    counts: triageCounts,
  }),
  handler: async (ctx, args) => {
    const collected = await collectTriage(ctx);
    const limit = Math.min(Math.max(args.limit ?? 100, 1), 200);
    return {
      items: collected.items.slice(0, limit).map(({ sortAt: _sortAt, ...row }) => row),
      counts: collected.counts,
    };
  },
});

export const countTriageMine = query({
  args: {},
  returns: triageCounts,
  handler: async (ctx) => {
    const collected = await collectTriage(ctx);
    return collected.counts;
  },
});

export const applyTriageMine = mutation({
  args: {
    kind: v.union(v.literal("transaction"), v.literal("duplicate")),
    id: v.string(),
    action: v.union(
      v.literal("categorise"),
      v.literal("confirm"),
      v.literal("ignore"),
    ),
    categoryExternalId: v.optional(v.string()),
  },
  returns: v.object({
    snapshot: triageSnapshot,
    createdTransactionId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (args.kind === "duplicate") {
      const row = await ctx.db
        .query("duplicateCandidates")
        .withIndex("by_externalId", (q) => q.eq("externalId", args.id))
        .unique();
      if (!row || row.userId !== user._id) {
        throw new Error("Duplicate not found");
      }
      const snapshot = {
        kind: "duplicate" as const,
        id: row.externalId,
        categoryId: null,
        confidenceScore: null,
        triageIgnored: false,
        duplicateStatus: row.status ?? "pending",
        createdTransactionId: null as string | null,
      };
      if (args.action === "confirm") {
        const fields = duplicatePayloadFields(row.payload);
        if (!fields) throw new Error("Duplicate transaction data is incomplete");
        const createdId = newExternalId();
        const now = Date.now();
        await ctx.db.insert("transactions", {
          externalId: createdId,
          userId: user._id,
          userExternalId: user.externalId,
          transactionDate: fields.date,
          description: fields.merchant,
          amount: fields.amount,
          transactionType: fields.transactionType,
          reference: fields.bankMeta ?? undefined,
          source: "import",
          isReconciled: false,
          createdAt: now,
          updatedAt: now,
        });
        await ctx.db.patch(row._id, { status: "kept_both" });
        return {
          snapshot: { ...snapshot, createdTransactionId: createdId },
          createdTransactionId: createdId,
        };
      }
      await ctx.db.patch(row._id, { status: "dismissed" });
      return { snapshot, createdTransactionId: null };
    }

    const row = await ctx.db
      .query("transactions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.id))
      .unique();
    if (!row || row.userId !== user._id) {
      throw new Error("Transaction not found");
    }
    const snapshot = {
      kind: "transaction" as const,
      id: row.externalId,
      categoryId: row.categoryExternalId ?? null,
      confidenceScore: row.confidenceScore ?? null,
      triageIgnored: Boolean(row.triageIgnoredAt),
      duplicateStatus: null,
      createdTransactionId: null,
    };

    if (args.action === "ignore") {
      await ctx.db.patch(row._id, {
        triageIgnoredAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { snapshot, createdTransactionId: null };
    }

    if (args.action === "categorise") {
      if (!args.categoryExternalId) {
        throw new Error("Category is required");
      }
      const cat = await ctx.db
        .query("categories")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", args.categoryExternalId as string),
        )
        .unique();
      if (!cat) throw new Error("Category not found");
      await ctx.db.patch(row._id, {
        categoryId: cat._id,
        categoryExternalId: cat.externalId,
        confidenceScore: 100,
        triageIgnoredAt: undefined,
        updatedAt: Date.now(),
      });
      return { snapshot, createdTransactionId: null };
    }

    await ctx.db.patch(row._id, {
      confidenceScore: 100,
      triageIgnoredAt: undefined,
      updatedAt: Date.now(),
    });
    return { snapshot, createdTransactionId: null };
  },
});

export const undoTriageMine = mutation({
  args: {
    snapshot: triageSnapshot,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const { snapshot } = args;
    if (snapshot.kind === "duplicate") {
      const row = await ctx.db
        .query("duplicateCandidates")
        .withIndex("by_externalId", (q) => q.eq("externalId", snapshot.id))
        .unique();
      if (!row || row.userId !== user._id) {
        throw new Error("Duplicate not found");
      }
      if (snapshot.createdTransactionId) {
        const created = await ctx.db
          .query("transactions")
          .withIndex("by_externalId", (q) =>
            q.eq("externalId", snapshot.createdTransactionId as string),
          )
          .unique();
        if (created && created.userId === user._id) {
          await ctx.db.delete(created._id);
        }
      }
      await ctx.db.patch(row._id, {
        status: snapshot.duplicateStatus ?? "pending",
      });
      return null;
    }

    const row = await ctx.db
      .query("transactions")
      .withIndex("by_externalId", (q) => q.eq("externalId", snapshot.id))
      .unique();
    if (!row || row.userId !== user._id) {
      throw new Error("Transaction not found");
    }
    let categoryId = row.categoryId;
    let categoryExternalId = row.categoryExternalId;
    if (snapshot.categoryId === null) {
      categoryId = undefined;
      categoryExternalId = undefined;
    } else if (snapshot.categoryId) {
      const cat = await ctx.db
        .query("categories")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", snapshot.categoryId as string),
        )
        .unique();
      categoryId = cat?._id;
      categoryExternalId = snapshot.categoryId;
    }
    await ctx.db.patch(row._id, {
      categoryId,
      categoryExternalId,
      confidenceScore: snapshot.confidenceScore ?? undefined,
      triageIgnoredAt: snapshot.triageIgnored ? Date.now() : undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const ignoreLowConfidenceMine = mutation({
  args: {},
  returns: v.object({
    count: v.number(),
    snapshots: v.array(triageSnapshot),
  }),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const snapshots: Array<{
      kind: "transaction";
      id: string;
      categoryId: string | null;
      confidenceScore: number | null;
      triageIgnored: boolean;
      duplicateStatus: null;
      createdTransactionId: null;
    }> = [];
    const now = Date.now();
    for (const row of rows) {
      if (transactionTriageReason(row) !== "low_confidence") continue;
      snapshots.push({
        kind: "transaction",
        id: row.externalId,
        categoryId: row.categoryExternalId ?? null,
        confidenceScore: row.confidenceScore ?? null,
        triageIgnored: Boolean(row.triageIgnoredAt),
        duplicateStatus: null,
        createdTransactionId: null,
      });
      await ctx.db.patch(row._id, {
        triageIgnoredAt: now,
        updatedAt: now,
      });
    }
    return { count: snapshots.length, snapshots };
  },
});

