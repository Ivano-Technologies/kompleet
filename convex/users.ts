import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getCurrentUser, getCurrentUserOrNull, supabaseSubject } from "./lib/auth";
import type { Id } from "./_generated/dataModel";
import { toMs } from "./lib/ids";

const userApi = v.object({
  id: v.string(),
  email: v.string(),
  full_name: v.union(v.string(), v.null()),
  phone: v.string(),
  entity_type: v.string(),
  tin: v.union(v.string(), v.null()),
  company_name: v.union(v.string(), v.null()),
  rc_number: v.union(v.string(), v.null()),
  company_address: v.union(v.string(), v.null()),
  subscription_tier: v.union(v.string(), v.null()),
  subscription_expires_at: v.union(v.string(), v.null()),
  default_currency: v.string(),
  fiscal_year_start: v.number(),
  onboarding_completed: v.boolean(),
  deleted_at: v.union(v.string(), v.null()),
  last_login_at: v.union(v.string(), v.null()),
  created_at: v.string(),
  updated_at: v.string(),
});

function toApi(user: {
  externalId: string;
  email: string;
  fullName?: string;
  phone: string;
  entityType: "individual" | "company";
  tin?: string;
  companyName?: string;
  rcNumber?: string;
  companyAddress?: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: number;
  defaultCurrency: string;
  fiscalYearStart: number;
  onboardingCompleted: boolean;
  deletedAt?: number;
  lastLoginAt?: number;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: user.externalId,
    email: user.email,
    full_name: user.fullName ?? null,
    phone: user.phone,
    entity_type: user.entityType,
    tin: user.tin ?? null,
    company_name: user.companyName ?? null,
    rc_number: user.rcNumber ?? null,
    company_address: user.companyAddress ?? null,
    subscription_tier: user.subscriptionTier ?? null,
    subscription_expires_at: user.subscriptionExpiresAt
      ? new Date(user.subscriptionExpiresAt).toISOString()
      : null,
    default_currency: user.defaultCurrency,
    fiscal_year_start: user.fiscalYearStart,
    onboarding_completed: user.onboardingCompleted,
    deleted_at: user.deletedAt
      ? new Date(user.deletedAt).toISOString()
      : null,
    last_login_at: user.lastLoginAt
      ? new Date(user.lastLoginAt).toISOString()
      : null,
    created_at: new Date(user.createdAt).toISOString(),
    updated_at: new Date(user.updatedAt).toISOString(),
  };
}

export const ensureCurrent = mutation({
  args: {
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
  },
  returns: userApi,
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const now = Date.now();
    const existing = await getCurrentUserOrNull(ctx);
    if (existing) {
      await ctx.db.patch(existing._id, {
        tokenIdentifier: identity.tokenIdentifier,
        email: args.email ?? existing.email,
        fullName: args.fullName ?? existing.fullName,
        lastLoginAt: now,
        updatedAt: now,
      });
      const updated = await ctx.db.get(existing._id);
      if (!updated) throw new Error("User not found");
      return toApi(updated);
    }
    const email =
      args.email ??
      (typeof identity.email === "string" ? identity.email : "") ??
      "";
    const byEmail = email
      ? await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email.toLowerCase()))
          .unique()
      : null;
    if (byEmail && !byEmail.deletedAt) {
      await ctx.db.patch(byEmail._id, {
        tokenIdentifier: identity.tokenIdentifier,
        email,
        fullName: args.fullName ?? byEmail.fullName,
        supabaseUserId: byEmail.supabaseUserId ?? byEmail.externalId,
        lastLoginAt: now,
        updatedAt: now,
      });
      const updated = await ctx.db.get(byEmail._id);
      if (!updated) throw new Error("User not found");
      return toApi(updated);
    }
    const externalId = supabaseSubject(identity);
    await ctx.db.insert("users", {
      externalId,
      tokenIdentifier: identity.tokenIdentifier,
      email,
      fullName: args.fullName,
      phone: "",
      entityType: "individual",
      defaultCurrency: "NGN",
      fiscalYearStart: 1,
      onboardingCompleted: false,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const created = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    if (!created) throw new Error("User not found");
    return toApi(created);
  },
});

export const getMine = query({
  args: {},
  returns: v.union(userApi, v.null()),
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user) return null;
    return toApi(user);
  },
});

export const updateMine = mutation({
  args: {
    fullName: v.optional(v.string()),
    phone: v.optional(v.string()),
    entityType: v.optional(
      v.union(v.literal("individual"), v.literal("company")),
    ),
    tin: v.optional(v.string()),
    companyName: v.optional(v.string()),
    rcNumber: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
    defaultCurrency: v.optional(v.string()),
    fiscalYearStart: v.optional(v.number()),
    onboardingCompleted: v.optional(v.boolean()),
    avatarStorageId: v.optional(v.id("_storage")),
  },
  returns: userApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await ctx.db.patch(user._id, {
      fullName: args.fullName ?? user.fullName,
      name: args.fullName ?? user.name,
      phone: args.phone ?? user.phone,
      entityType: args.entityType ?? user.entityType,
      tin: args.tin ?? user.tin,
      companyName: args.companyName ?? user.companyName,
      rcNumber: args.rcNumber ?? user.rcNumber,
      companyAddress: args.companyAddress ?? user.companyAddress,
      defaultCurrency: args.defaultCurrency ?? user.defaultCurrency,
      fiscalYearStart: args.fiscalYearStart ?? user.fiscalYearStart,
      onboardingCompleted: args.onboardingCompleted ?? user.onboardingCompleted,
      avatarStorageId: args.avatarStorageId ?? user.avatarStorageId,
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(user._id);
    if (!updated) throw new Error("User not found");
    return toApi(updated);
  },
});

export const softDeleteMine = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    await ctx.db.patch(user._id, { deletedAt: now, updatedAt: now });
    return null;
  },
});

export const listAll = query({
  args: {},
  returns: v.array(userApi),
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const rows = await ctx.db.query("users").take(200);
    return rows.filter((user) => !user.deletedAt).map(toApi);
  },
});

export const getEmailInternal = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId as Id<"users">);
    if (!user || user.deletedAt) return null;
    return user.email;
  },
});

export const listEmailsInternal = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      email: v.string(),
      externalId: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db.query("users").take(50);
    return rows
      .filter((user) => !user.deletedAt)
      .map((user) => ({ email: user.email, externalId: user.externalId }));
  },
});

export const upsertFromBackfill = internalMutation({
  args: {
    externalId: v.string(),
    email: v.string(),
    fullName: v.optional(v.string()),
    phone: v.optional(v.string()),
    entityType: v.optional(
      v.union(v.literal("individual"), v.literal("company")),
    ),
    tin: v.optional(v.string()),
    companyName: v.optional(v.string()),
    rcNumber: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
    subscriptionTier: v.optional(v.string()),
    subscriptionExpiresAt: v.optional(v.string()),
    defaultCurrency: v.optional(v.string()),
    fiscalYearStart: v.optional(v.number()),
    onboardingCompleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.string()),
    lastLoginAt: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    const now = Date.now();
    const fields = {
      email: args.email,
      fullName: args.fullName,
      phone: args.phone ?? "",
      entityType: args.entityType ?? "individual",
      tin: args.tin,
      companyName: args.companyName,
      rcNumber: args.rcNumber,
      companyAddress: args.companyAddress,
      subscriptionTier: args.subscriptionTier,
      subscriptionExpiresAt: toMs(args.subscriptionExpiresAt),
      defaultCurrency: args.defaultCurrency ?? "NGN",
      fiscalYearStart: args.fiscalYearStart ?? 1,
      onboardingCompleted: args.onboardingCompleted ?? false,
      deletedAt: toMs(args.deletedAt),
      lastLoginAt: toMs(args.lastLoginAt),
      createdAt: toMs(args.createdAt) ?? now,
      updatedAt: toMs(args.updatedAt) ?? now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing.externalId;
    }
    await ctx.db.insert("users", {
      externalId: args.externalId,
      ...fields,
    });
    return args.externalId;
  },
});
