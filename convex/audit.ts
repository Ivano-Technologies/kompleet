import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  cursorValidator,
  listCursorReturns,
  nextCursorOf,
  paginationOptsFromArgs,
} from "./lib/listPage";
import { getCurrentUser, getUserByExternalId } from "./lib/auth";
import { throwForbidden } from "./lib/errors";
import { assertDocumentWorkerToken } from "./lib/workerAuth";

export async function appendHandler(
  ctx: MutationCtx,
  args: {
    action: string;
    resourceType?: string;
    entityType?: string;
    entityId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: unknown;
  },
) {
  const user = await getCurrentUser(ctx);
  const id = await ctx.db.insert("auditLogs", {
    userId: user._id,
    userExternalId: user.externalId,
    action: args.action,
    resourceType: args.resourceType,
    entityType: args.entityType,
    entityId: args.entityId,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    metadata: args.metadata,
    createdAt: Date.now(),
  });
  return String(id);
}

export const append = mutation({
  args: {
    action: v.string(),
    resourceType: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.union(v.string(), v.null()),
  handler: appendHandler,
});

export const appendForWorker = mutation({
  args: {
    workerToken: v.string(),
    userExternalId: v.string(),
    action: v.string(),
    resourceType: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    assertDocumentWorkerToken(args.workerToken);
    const user = await getUserByExternalId(ctx, args.userExternalId);
    const id = await ctx.db.insert("auditLogs", {
      userId: user?._id,
      userExternalId: args.userExternalId,
      action: args.action,
      resourceType: args.resourceType,
      entityType: args.entityType,
      entityId: args.entityId,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
    return String(id);
  },
});

export const appendInternal = internalMutation({
  args: {
    userExternalId: v.string(),
    action: v.string(),
    resourceType: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await getUserByExternalId(ctx, args.userExternalId);
    const id = await ctx.db.insert("auditLogs", {
      userId: user?._id,
      userExternalId: args.userExternalId,
      action: args.action,
      resourceType: args.resourceType,
      entityType: args.entityType,
      entityId: args.entityId,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
    return String(id);
  },
});

export const listMine = query({
  args: {
    cursor: cursorValidator,
    limit: v.optional(v.number()),
  },
  returns: v.object({
    logs: v.array(v.any()),
    ...listCursorReturns,
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const result = await ctx.db
      .query("auditLogs")
      .withIndex("by_userExternalId", (q) =>
        q.eq("userExternalId", user.externalId),
      )
      .order("desc")
      .paginate(paginationOptsFromArgs(args));
    return {
      logs: result.page.map((r) => ({
        id: r._id,
        user_id: r.userExternalId ?? null,
        action: r.action,
        resource_type: r.resourceType ?? null,
        entity_type: r.entityType ?? null,
        entity_id: r.entityId ?? null,
        metadata: r.metadata ?? null,
        created_at: new Date(r.createdAt).toISOString(),
      })),
      nextCursor: nextCursorOf(result),
      isDone: result.isDone,
    };
  },
});

export async function removeMineHandler(
  ctx: MutationCtx,
  args: { id: Id<"auditLogs"> },
) {
  const user = await getCurrentUser(ctx);
  const row = await ctx.db.get(args.id);
  if (!row) throw new Error("Audit log not found");
  const owns =
    row.userExternalId === user.externalId || row.userId === user._id;
  if (!owns) throwForbidden();
  await ctx.db.delete(args.id);
  return null;
}

export const removeMine = mutation({
  args: { id: v.id("auditLogs") },
  returns: v.null(),
  handler: removeMineHandler,
});
