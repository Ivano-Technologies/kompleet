import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { newExternalId, toMs } from "./lib/ids";

const exportApi = v.object({
  id: v.string(),
  user_id: v.string(),
  export_type: v.string(),
  format: v.union(v.string(), v.null()),
  tax_year: v.union(v.number(), v.null()),
  status: v.string(),
  file_size: v.union(v.number(), v.null()),
  expires_at: v.union(v.string(), v.null()),
  completed_at: v.union(v.string(), v.null()),
  created_at: v.string(),
});

function toApi(row: {
  externalId: string;
  userExternalId: string;
  exportType: string;
  format?: string;
  taxYear?: number;
  status: string;
  fileSize?: number;
  expiresAt?: number;
  completedAt?: number;
  createdAt: number;
}) {
  return {
    id: row.externalId,
    user_id: row.userExternalId,
    export_type: row.exportType,
    format: row.format ?? null,
    tax_year: row.taxYear ?? null,
    status: row.status,
    file_size: row.fileSize ?? null,
    expires_at: row.expiresAt ? new Date(row.expiresAt).toISOString() : null,
    completed_at: row.completedAt
      ? new Date(row.completedAt).toISOString()
      : null,
    created_at: new Date(row.createdAt).toISOString(),
  };
}

export const listMine = query({
  args: {},
  returns: v.array(exportApi),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("exportHistory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows.map(toApi);
  },
});

export const createMine = mutation({
  args: {
    exportType: v.string(),
    format: v.optional(v.string()),
    taxYear: v.optional(v.number()),
    status: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
  },
  returns: exportApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    const externalId = newExternalId();
    await ctx.db.insert("exportHistory", {
      externalId,
      userId: user._id,
      userExternalId: user.externalId,
      exportType: args.exportType,
      format: args.format,
      taxYear: args.taxYear,
      status: args.status ?? "completed",
      fileSize: args.fileSize,
      storageId: args.storageId,
      completedAt: now,
      createdAt: now,
    });
    const row = await ctx.db
      .query("exportHistory")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    if (!row) throw new Error("Export history not found");
    return toApi(row);
  },
});

export const upsertFromBackfill = internalMutation({
  args: {
    externalId: v.string(),
    userExternalId: v.string(),
    exportType: v.string(),
    format: v.optional(v.string()),
    taxYear: v.optional(v.number()),
    status: v.string(),
    fileSize: v.optional(v.number()),
    expiresAt: v.optional(v.string()),
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
      .query("exportHistory")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    const fields = {
      userId: user._id,
      userExternalId: user.externalId,
      exportType: args.exportType,
      format: args.format,
      taxYear: args.taxYear,
      status: args.status,
      fileSize: args.fileSize,
      expiresAt: toMs(args.expiresAt),
      completedAt: toMs(args.completedAt),
      createdAt: toMs(args.createdAt) ?? Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing.externalId;
    }
    await ctx.db.insert("exportHistory", {
      externalId: args.externalId,
      ...fields,
    });
    return args.externalId;
  },
});
