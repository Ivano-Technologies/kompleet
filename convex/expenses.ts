import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { newExternalId, toMs } from "./lib/ids";

const expenseApi = v.object({
  id: v.string(),
  user_id: v.string(),
  date: v.string(),
  amount: v.number(),
  currency: v.string(),
  category_id: v.union(v.string(), v.null()),
  vendor: v.union(v.string(), v.null()),
  vat_amount: v.union(v.number(), v.null()),
  receipt_url: v.union(v.string(), v.null()),
  notes: v.union(v.string(), v.null()),
  created_at: v.string(),
  updated_at: v.string(),
});

function toApi(row: {
  externalId: string;
  userExternalId: string;
  date: string;
  amount: number;
  currency: string;
  categoryExternalId?: string;
  vendor?: string;
  vatAmount?: number;
  receiptUrl?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: row.externalId,
    user_id: row.userExternalId,
    date: row.date,
    amount: row.amount,
    currency: row.currency,
    category_id: row.categoryExternalId ?? null,
    vendor: row.vendor ?? null,
    vat_amount: row.vatAmount ?? null,
    receipt_url: row.receiptUrl ?? null,
    notes: row.notes ?? null,
    created_at: new Date(row.createdAt).toISOString(),
    updated_at: new Date(row.updatedAt).toISOString(),
  };
}

export const listMine = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    categoryId: v.optional(v.string()),
    updatedSince: v.optional(v.string()),
    page: v.number(),
    limit: v.number(),
  },
  returns: v.object({ expenses: v.array(expenseApi), total: v.number() }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    let rows = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    if (args.startDate) {
      rows = rows.filter((r) => r.date >= args.startDate!);
    }
    if (args.endDate) {
      rows = rows.filter((r) => r.date <= args.endDate!);
    }
    if (args.categoryId) {
      rows = rows.filter((r) => r.categoryExternalId === args.categoryId);
    }
    if (args.updatedSince) {
      const since = Date.parse(args.updatedSince);
      if (!Number.isNaN(since)) {
        rows = rows.filter((r) => r.updatedAt >= since);
      }
    }
    rows.sort((a, b) =>
      a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1,
    );
    const total = rows.length;
    const start = (args.page - 1) * args.limit;
    return {
      expenses: rows.slice(start, start + args.limit).map(toApi),
      total,
    };
  },
});

export const getMine = query({
  args: { externalId: v.string() },
  returns: v.union(expenseApi, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("expenses")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) return null;
    return toApi(row);
  },
});

export const createMine = mutation({
  args: {
    externalId: v.optional(v.string()),
    date: v.string(),
    amount: v.number(),
    currency: v.optional(v.string()),
    categoryExternalId: v.optional(v.string()),
    vendor: v.optional(v.string()),
    vatAmount: v.optional(v.number()),
    receiptUrl: v.optional(v.string()),
    receiptStorageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  returns: expenseApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (args.externalId) {
      const existing = await ctx.db
        .query("expenses")
        .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId!))
        .unique();
      if (existing) {
        if (existing.userId !== user._id) {
          throw new Error("Expense already exists");
        }
        return toApi(existing);
      }
    }
    let categoryId;
    if (args.categoryExternalId) {
      const cat = await ctx.db
        .query("expenseCategories")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", args.categoryExternalId!),
        )
        .unique();
      categoryId = cat?._id;
    }
    const now = Date.now();
    const externalId = args.externalId ?? newExternalId();
    await ctx.db.insert("expenses", {
      externalId,
      userId: user._id,
      userExternalId: user.externalId,
      date: args.date,
      amount: args.amount,
      currency: args.currency ?? "NGN",
      categoryId,
      categoryExternalId: args.categoryExternalId,
      vendor: args.vendor,
      vatAmount: args.vatAmount,
      receiptUrl: args.receiptUrl,
      receiptStorageId: args.receiptStorageId,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
    const row = await ctx.db
      .query("expenses")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    if (!row) throw new Error("Expense not found");
    return toApi(row);
  },
});

export const updateMine = mutation({
  args: {
    externalId: v.string(),
    date: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    categoryExternalId: v.optional(v.union(v.string(), v.null())),
    vendor: v.optional(v.string()),
    vatAmount: v.optional(v.number()),
    receiptUrl: v.optional(v.string()),
    receiptStorageId: v.optional(v.id("_storage")),
    notes: v.optional(v.string()),
  },
  returns: expenseApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("expenses")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) throw new Error("Expense not found");
    await ctx.db.patch(row._id, {
      date: args.date ?? row.date,
      amount: args.amount ?? row.amount,
      currency: args.currency ?? row.currency,
      categoryExternalId:
        args.categoryExternalId === null
          ? undefined
          : (args.categoryExternalId ?? row.categoryExternalId),
      vendor: args.vendor ?? row.vendor,
      vatAmount: args.vatAmount ?? row.vatAmount,
      receiptUrl: args.receiptUrl ?? row.receiptUrl,
      receiptStorageId: args.receiptStorageId ?? row.receiptStorageId,
      notes: args.notes ?? row.notes,
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Expense not found");
    return toApi(updated);
  },
});

export const removeMine = mutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("expenses")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) throw new Error("Expense not found");
    await ctx.db.delete(row._id);
    return null;
  },
});

export const listCategories = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      user_id: v.union(v.string(), v.null()),
      name: v.string(),
      is_custom: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db.query("expenseCategories").collect();
    return rows
      .filter((r) => !r.userId || r.userId === user._id)
      .map((r) => ({
        id: r.externalId,
        user_id: r.userExternalId ?? null,
        name: r.name,
        is_custom: r.isCustom,
      }));
  },
});

export const upsertExpenseCategoryFromBackfill = internalMutation({
  args: {
    externalId: v.string(),
    userExternalId: v.optional(v.string()),
    name: v.string(),
    isCustom: v.boolean(),
    createdAt: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    let userId;
    if (args.userExternalId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", args.userExternalId!),
        )
        .unique();
      userId = user?._id;
    }
    const existing = await ctx.db
      .query("expenseCategories")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    const fields = {
      userId,
      userExternalId: args.userExternalId,
      name: args.name,
      isCustom: args.isCustom,
      createdAt: toMs(args.createdAt) ?? Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing.externalId;
    }
    await ctx.db.insert("expenseCategories", {
      externalId: args.externalId,
      ...fields,
    });
    return args.externalId;
  },
});
