import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { newExternalId } from "./lib/ids";

export const listMyClients = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      legal_name: v.string(),
      tin: v.union(v.string(), v.null()),
      entity_type: v.union(v.string(), v.null()),
      status: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const memberships = await ctx.db
      .query("firmMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const clients = [];
    for (const membership of memberships) {
      const firmClients = await ctx.db
        .query("clients")
        .withIndex("by_firm", (q) => q.eq("firmId", membership.firmId))
        .collect();
      for (const client of firmClients) {
        if (client.archivedAt) continue;
        clients.push({
          id: client.externalId,
          legal_name: client.legalName,
          tin: client.tin ?? null,
          entity_type: client.entityType ?? null,
          status: client.status,
        });
      }
    }
    return clients;
  },
});

export const createFirmWithClient = mutation({
  args: {
    firmName: v.string(),
    clientLegalName: v.string(),
    tin: v.optional(v.string()),
    entityType: v.optional(
      v.union(v.literal("individual"), v.literal("company")),
    ),
  },
  returns: v.object({
    firmId: v.string(),
    clientId: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    const firmExternalId = newExternalId();
    const firmId = await ctx.db.insert("firms", {
      externalId: firmExternalId,
      name: args.firmName,
      ownerUserId: user._id,
      ownerExternalId: user.externalId,
      subscriptionTier: "free",
      createdAt: now,
    });
    await ctx.db.insert("firmMembers", {
      firmId,
      userId: user._id,
      userExternalId: user.externalId,
      role: "owner",
    });
    const clientExternalId = newExternalId();
    await ctx.db.insert("clients", {
      externalId: clientExternalId,
      firmId,
      legalName: args.clientLegalName,
      tin: args.tin,
      entityType: args.entityType,
      status: "active",
      createdAt: now,
    });
    return { firmId: firmExternalId, clientId: clientExternalId };
  },
});

export const createClient = mutation({
  args: {
    legalName: v.string(),
    tin: v.optional(v.string()),
  },
  returns: v.object({
    id: v.string(),
    legal_name: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const legalName = args.legalName.trim();
    if (legalName.length < 1) {
      throw new Error("Client name is required");
    }
    if (legalName.length > 200) {
      throw new Error("Client name must be less than 200 characters");
    }

    const memberships = await ctx.db
      .query("firmMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let firmId = memberships[0]?.firmId;
    if (!firmId) {
      const now = Date.now();
      firmId = await ctx.db.insert("firms", {
        externalId: newExternalId(),
        name: user.companyName || user.fullName || user.name?.trim() || "My firm",
        ownerUserId: user._id,
        ownerExternalId: user.externalId,
        subscriptionTier: "free",
        createdAt: now,
      });
      await ctx.db.insert("firmMembers", {
        firmId,
        userId: user._id,
        userExternalId: user.externalId,
        role: "owner",
      });
    }

    const clientExternalId = newExternalId();
    await ctx.db.insert("clients", {
      externalId: clientExternalId,
      firmId,
      legalName,
      tin: args.tin,
      status: "active",
      createdAt: Date.now(),
    });

    return { id: clientExternalId, legal_name: legalName };
  },
});
