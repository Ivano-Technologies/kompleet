import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { toMs } from "./lib/ids";

const categoryApi = v.object({
  id: v.string(),
  name: v.string(),
  category_type: v.string(),
  tax_treatment: v.string(),
  keywords: v.array(v.string()),
  description: v.union(v.string(), v.null()),
  is_system: v.boolean(),
});

function toApi(row: {
  externalId: string;
  name: string;
  categoryType: string;
  taxTreatment: string;
  keywords: string[];
  description?: string;
  isSystem: boolean;
}) {
  return {
    id: row.externalId,
    name: row.name,
    category_type: row.categoryType,
    tax_treatment: row.taxTreatment,
    keywords: row.keywords,
    description: row.description ?? null,
    is_system: row.isSystem,
  };
}

export const list = query({
  args: {},
  returns: v.array(categoryApi),
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const rows = await ctx.db.query("categories").collect();
    return rows.map(toApi);
  },
});

export const getByExternalId = query({
  args: { externalId: v.string() },
  returns: v.union(categoryApi, v.null()),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const row = await ctx.db
      .query("categories")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    return row ? toApi(row) : null;
  },
});

export const updateByExternalId = mutation({
  args: {
    externalId: v.string(),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
  },
  returns: v.union(categoryApi, v.null()),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const row = await ctx.db
      .query("categories")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row) return null;
    await ctx.db.patch(row._id, {
      name: args.name ?? row.name,
      description: args.description ?? row.description,
      keywords: args.keywords ?? row.keywords,
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(row._id);
    return updated ? toApi(updated) : null;
  },
});

export const upsertFromBackfill = internalMutation({
  args: {
    externalId: v.string(),
    name: v.string(),
    categoryType: v.string(),
    taxTreatment: v.string(),
    keywords: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    isSystem: v.optional(v.boolean()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    const now = Date.now();
    const fields = {
      name: args.name,
      categoryType: args.categoryType,
      taxTreatment: args.taxTreatment,
      keywords: args.keywords ?? [],
      description: args.description,
      isSystem: args.isSystem ?? true,
      createdAt: toMs(args.createdAt) ?? now,
      updatedAt: toMs(args.updatedAt) ?? now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing.externalId;
    }
    await ctx.db.insert("categories", {
      externalId: args.externalId,
      ...fields,
    });
    return args.externalId;
  },
});
