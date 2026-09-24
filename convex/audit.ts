import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

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
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    let user;
    try {
      user = await getCurrentUser(ctx);
    } catch {
      user = null;
    }
    await ctx.db.insert("auditLogs", {
      userId: user?._id,
      userExternalId: user?.externalId,
      action: args.action,
      resourceType: args.resourceType,
      entityType: args.entityType,
      entityId: args.entityId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const listMine = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("auditLogs")
      .withIndex("by_userExternalId", (q) =>
        q.eq("userExternalId", user.externalId),
      )
      .collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows.map((r) => ({
      id: r._id,
      user_id: r.userExternalId ?? null,
      action: r.action,
      resource_type: r.resourceType ?? null,
      entity_type: r.entityType ?? null,
      entity_id: r.entityId ?? null,
      created_at: new Date(r.createdAt).toISOString(),
    }));
  },
});
