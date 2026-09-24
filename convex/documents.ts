import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { newExternalId } from "./lib/ids";

const documentApi = v.object({
  id: v.string(),
  user_id: v.string(),
  status: v.string(),
  file_name: v.union(v.string(), v.null()),
  content_type: v.union(v.string(), v.null()),
  idempotency_key: v.union(v.string(), v.null()),
  processing_attempt_count: v.number(),
  created_at: v.string(),
  updated_at: v.string(),
});

function toApi(row: {
  externalId: string;
  userExternalId: string;
  status: string;
  fileName?: string;
  contentType?: string;
  idempotencyKey?: string;
  processingAttemptCount: number;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: row.externalId,
    user_id: row.userExternalId,
    status: row.status,
    file_name: row.fileName ?? null,
    content_type: row.contentType ?? null,
    idempotency_key: row.idempotencyKey ?? null,
    processing_attempt_count: row.processingAttemptCount,
    created_at: new Date(row.createdAt).toISOString(),
    updated_at: new Date(row.updatedAt).toISOString(),
  };
}

export const getMine = query({
  args: { externalId: v.string() },
  returns: v.union(documentApi, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("documents")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) return null;
    return toApi(row);
  },
});

export const createMine = mutation({
  args: {
    fileName: v.optional(v.string()),
    contentType: v.optional(v.string()),
    idempotencyKey: v.optional(v.string()),
    status: v.optional(v.string()),
    payload: v.optional(v.any()),
  },
  returns: documentApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (args.idempotencyKey) {
      const existing = await ctx.db
        .query("documents")
        .withIndex("by_user_and_idempotencyKey", (q) =>
          q.eq("userId", user._id).eq("idempotencyKey", args.idempotencyKey),
        )
        .unique();
      if (existing) return toApi(existing);
    }
    const now = Date.now();
    const externalId = newExternalId();
    await ctx.db.insert("documents", {
      externalId,
      userId: user._id,
      userExternalId: user.externalId,
      idempotencyKey: args.idempotencyKey,
      status: args.status ?? "queued",
      fileName: args.fileName,
      contentType: args.contentType,
      processingAttemptCount: 0,
      payload: args.payload,
      createdAt: now,
      updatedAt: now,
    });
    const row = await ctx.db
      .query("documents")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    if (!row) throw new Error("Document not found");
    return toApi(row);
  },
});

export const patchInternal = internalMutation({
  args: {
    externalId: v.string(),
    status: v.optional(v.string()),
    processingStartedAt: v.optional(v.number()),
    processingAttemptCount: v.optional(v.number()),
    payload: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("documents")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row) throw new Error("Document not found");
    await ctx.db.patch(row._id, {
      status: args.status ?? row.status,
      processingStartedAt: args.processingStartedAt ?? row.processingStartedAt,
      processingAttemptCount:
        args.processingAttemptCount ?? row.processingAttemptCount,
      payload: args.payload ?? row.payload,
      updatedAt: Date.now(),
    });
    return null;
  },
});
