import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { newExternalId, toMs } from "./lib/ids";

const sessionApi = v.object({
  id: v.string(),
  user_id: v.string(),
  file_name: v.string(),
  file_size: v.union(v.number(), v.null()),
  bank_code: v.union(v.string(), v.null()),
  status: v.string(),
  transactions_imported: v.number(),
  errors_count: v.number(),
  total_amount: v.union(v.number(), v.null()),
  completed_at: v.union(v.string(), v.null()),
  created_at: v.string(),
});

function toSessionApi(row: {
  externalId: string;
  userExternalId: string;
  fileName: string;
  fileSize?: number;
  bankCode?: string;
  status: string;
  transactionsImported: number;
  errorsCount: number;
  totalAmount?: number;
  completedAt?: number;
  createdAt: number;
}) {
  return {
    id: row.externalId,
    user_id: row.userExternalId,
    file_name: row.fileName,
    file_size: row.fileSize ?? null,
    bank_code: row.bankCode ?? null,
    status: row.status,
    transactions_imported: row.transactionsImported,
    errors_count: row.errorsCount,
    total_amount: row.totalAmount ?? null,
    completed_at: row.completedAt
      ? new Date(row.completedAt).toISOString()
      : null,
    created_at: new Date(row.createdAt).toISOString(),
  };
}

export const createSession = mutation({
  args: {
    fileName: v.string(),
    fileSize: v.optional(v.number()),
    bankCode: v.optional(v.string()),
    status: v.optional(v.string()),
    externalId: v.optional(v.string()),
  },
  returns: sessionApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const externalId = args.externalId ?? newExternalId();
    await ctx.db.insert("importSessions", {
      externalId,
      userId: user._id,
      userExternalId: user.externalId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      bankCode: args.bankCode,
      status: args.status ?? "processing",
      transactionsImported: 0,
      errorsCount: 0,
      createdAt: Date.now(),
    });
    const row = await ctx.db
      .query("importSessions")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    if (!row) throw new Error("Import session not found");
    return toSessionApi(row);
  },
});

export const attachStorage = mutation({
  args: {
    externalId: v.string(),
    storageId: v.id("_storage"),
  },
  returns: sessionApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("importSessions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) {
      throw new Error("Import session not found");
    }
    await ctx.db.patch(row._id, { storageId: args.storageId });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Import session not found");
    return toSessionApi(updated);
  },
});

export const updateSession = mutation({
  args: {
    externalId: v.string(),
    status: v.optional(v.string()),
    transactionsImported: v.optional(v.number()),
    errorsCount: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    completed: v.optional(v.boolean()),
  },
  returns: sessionApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("importSessions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) {
      throw new Error("Import session not found");
    }
    await ctx.db.patch(row._id, {
      status: args.status ?? row.status,
      transactionsImported:
        args.transactionsImported ?? row.transactionsImported,
      errorsCount: args.errorsCount ?? row.errorsCount,
      totalAmount: args.totalAmount ?? row.totalAmount,
      completedAt: args.completed ? Date.now() : row.completedAt,
    });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Import session not found");
    return toSessionApi(updated);
  },
});

export const listMine = query({
  args: {},
  returns: v.array(sessionApi),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("importSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows.map(toSessionApi);
  },
});

export const addErrors = mutation({
  args: {
    sessionExternalId: v.string(),
    errors: v.array(
      v.object({
        rowNumber: v.optional(v.number()),
        errorType: v.optional(v.string()),
        errorMessage: v.optional(v.string()),
        rawData: v.optional(v.any()),
      }),
    ),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const session = await ctx.db
      .query("importSessions")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", args.sessionExternalId),
      )
      .unique();
    if (!session || session.userId !== user._id) {
      throw new Error("Import session not found");
    }
    for (const err of args.errors) {
      await ctx.db.insert("importErrors", {
        externalId: newExternalId(),
        sessionId: session._id,
        sessionExternalId: session.externalId,
        rowNumber: err.rowNumber,
        errorType: err.errorType,
        errorMessage: err.errorMessage,
        rawData: err.rawData,
        createdAt: Date.now(),
      });
    }
    return args.errors.length;
  },
});

export const listErrors = query({
  args: { sessionExternalId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const session = await ctx.db
      .query("importSessions")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", args.sessionExternalId),
      )
      .unique();
    if (!session || session.userId !== user._id) return [];
    const rows = await ctx.db
      .query("importErrors")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();
    return rows.map((r) => ({
      id: r.externalId,
      session_id: r.sessionExternalId,
      row_number: r.rowNumber ?? null,
      error_type: r.errorType ?? null,
      error_message: r.errorMessage ?? null,
      raw_data: r.rawData ?? null,
      created_at: new Date(r.createdAt).toISOString(),
    }));
  },
});

export const addDuplicates = mutation({
  args: {
    sessionExternalId: v.string(),
    candidates: v.array(v.any()),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const session = await ctx.db
      .query("importSessions")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", args.sessionExternalId),
      )
      .unique();
    if (!session || session.userId !== user._id) {
      throw new Error("Import session not found");
    }
    for (const payload of args.candidates) {
      await ctx.db.insert("duplicateCandidates", {
        externalId: newExternalId(),
        sessionId: session._id,
        sessionExternalId: session.externalId,
        userId: user._id,
        payload,
        status: "pending",
        createdAt: Date.now(),
      });
    }
    return args.candidates.length;
  },
});

export const listDuplicates = query({
  args: {
    sessionExternalId: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("duplicateCandidates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    let filtered = args.sessionExternalId
      ? rows.filter((r) => r.sessionExternalId === args.sessionExternalId)
      : rows;
    if (args.status) {
      filtered = filtered.filter(
        (r) => (r.status ?? "pending") === args.status,
      );
    }
    filtered.sort((a, b) => b.createdAt - a.createdAt);
    return filtered.map((r) => {
      const payload =
        typeof r.payload === "object" && r.payload !== null
          ? (r.payload as Record<string, unknown>)
          : {};
      return {
        id: r.externalId,
        session_id: r.sessionExternalId,
        ...payload,
        // Row status must win over payload.status from addDuplicates.
        status: r.status ?? "pending",
      };
    });
  },
});

function readKeptBothTransaction(payload: unknown): {
  date: string;
  merchant: string;
  amount: number;
  type: "debit" | "credit";
  balance?: number;
  reference?: string;
  bankCode?: string;
} {
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid duplicate payload");
  }
  const record = payload as Record<string, unknown>;
  const data = record.new_transaction_data;
  if (typeof data !== "object" || data === null) {
    throw new Error("Duplicate is missing new transaction data");
  }
  const txn = data as Record<string, unknown>;
  const date = typeof txn.date === "string" ? txn.date : "";
  const merchant = typeof txn.merchant === "string" ? txn.merchant : "";
  const amount = typeof txn.amount === "number" ? txn.amount : NaN;
  const type = txn.type === "credit" ? "credit" : "debit";
  if (!date || !merchant || Number.isNaN(amount)) {
    throw new Error("Duplicate transaction data is incomplete");
  }
  const metadata =
    typeof txn.metadata === "object" && txn.metadata !== null
      ? (txn.metadata as Record<string, unknown>)
      : {};
  return {
    date,
    merchant,
    amount,
    type,
    balance: typeof txn.balance === "number" ? txn.balance : undefined,
    reference: typeof txn.reference === "string" ? txn.reference : undefined,
    bankCode:
      typeof metadata.bankCode === "string" ? metadata.bankCode : undefined,
  };
}

export const resolveDuplicate = mutation({
  args: {
    externalId: v.string(),
    action: v.union(
      v.literal("merged"),
      v.literal("kept_both"),
      v.literal("rejected"),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("duplicateCandidates")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) {
      throw new Error("Duplicate not found");
    }

    if (args.action === "kept_both") {
      const txn = readKeptBothTransaction(row.payload);
      const now = Date.now();
      await ctx.db.insert("transactions", {
        externalId: newExternalId(),
        userId: user._id,
        userExternalId: user.externalId,
        transactionDate: txn.date,
        description: txn.merchant,
        amount: txn.amount,
        transactionType: txn.type,
        balance: txn.balance,
        reference: txn.reference,
        source: txn.bankCode ? `${txn.bankCode}_import` : "import",
        isReconciled: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(row._id, { status: args.action });

    const messages: Record<typeof args.action, string> = {
      merged: "Duplicate merged with existing transaction",
      kept_both: "Both transactions kept",
      rejected: "New transaction rejected",
    };
    return { success: true, message: messages[args.action] };
  },
});

export const upsertErrorFromBackfill = internalMutation({
  args: {
    externalId: v.string(),
    sessionExternalId: v.string(),
    rowNumber: v.optional(v.number()),
    errorType: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    rawData: v.optional(v.any()),
    createdAt: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("importSessions")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", args.sessionExternalId),
      )
      .unique();
    if (!session) throw new Error("Import session not found");
    const existing = await ctx.db
      .query("importErrors")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    const fields = {
      sessionId: session._id,
      sessionExternalId: session.externalId,
      rowNumber: args.rowNumber,
      errorType: args.errorType,
      errorMessage: args.errorMessage,
      rawData: args.rawData,
      createdAt: toMs(args.createdAt) ?? Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing.externalId;
    }
    await ctx.db.insert("importErrors", {
      externalId: args.externalId,
      ...fields,
    });
    return args.externalId;
  },
});

export const upsertSessionFromBackfill = internalMutation({
  args: {
    externalId: v.string(),
    userExternalId: v.string(),
    fileName: v.string(),
    fileSize: v.optional(v.number()),
    bankCode: v.optional(v.string()),
    status: v.string(),
    transactionsImported: v.optional(v.number()),
    errorsCount: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    completedAt: v.optional(v.string()),
    createdAt: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.userExternalId))
      .unique();
    if (!user) throw new Error("User not found");
    const existing = await ctx.db
      .query("importSessions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    const fields = {
      userId: user._id,
      userExternalId: user.externalId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      bankCode: args.bankCode,
      status: args.status,
      transactionsImported: args.transactionsImported ?? 0,
      errorsCount: args.errorsCount ?? 0,
      totalAmount: args.totalAmount,
      completedAt: toMs(args.completedAt),
      createdAt: toMs(args.createdAt) ?? Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing.externalId;
    }
    await ctx.db.insert("importSessions", {
      externalId: args.externalId,
      ...fields,
    });
    return args.externalId;
  },
});
