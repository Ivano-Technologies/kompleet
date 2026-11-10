import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { assertStorageAssignableToUser } from "./lib/storageAccess";
import { newExternalId } from "./lib/ids";
import {
  DEFAULT_COUNTRY,
  clientHasIssuedInvoices,
  getOrCreateUserFirm,
  isValidEmail,
  loadBusinessProfile,
  logoUsedOnIssuedInvoice,
  toClientApi,
  trimToEmpty,
  trimToUndef,
} from "./lib/profiles";
import { sniffImage } from "./lib/imageMeta";

const businessProfileApi = v.object({
  legalName: v.string(),
  addressLine1: v.string(),
  addressLine2: v.string(),
  city: v.string(),
  state: v.string(),
  country: v.string(),
  email: v.string(),
  phone: v.string(),
  tin: v.string(),
  vatNumber: v.string(),
  complete: v.boolean(),
  logoStorageId: v.union(v.id("_storage"), v.null()),
  logoUrl: v.union(v.string(), v.null()),
  logoWidth: v.union(v.number(), v.null()),
  logoHeight: v.union(v.number(), v.null()),
});

const clientApi = v.object({
  id: v.string(),
  legal_name: v.string(),
  email: v.string(),
  phone: v.string(),
  addressLine1: v.string(),
  addressLine2: v.string(),
  city: v.string(),
  state: v.string(),
  country: v.string(),
  tin: v.union(v.string(), v.null()),
  entity_type: v.union(v.string(), v.null()),
  status: v.string(),
  used_on_issued: v.boolean(),
});

const optionalClientFields = {
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  addressLine1: v.optional(v.string()),
  addressLine2: v.optional(v.string()),
  city: v.optional(v.string()),
  state: v.optional(v.string()),
  country: v.optional(v.string()),
  tin: v.optional(v.string()),
};

export const getMyBusinessProfile = query({
  args: {},
  returns: businessProfileApi,
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await loadBusinessProfile(ctx, user);
  },
});

export const upsertMyBusinessProfile = mutation({
  args: {
    legalName: v.optional(v.string()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    tin: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
  },
  returns: businessProfileApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const legalName = trimToEmpty(args.legalName);
    const email = trimToEmpty(args.email);
    if (email && !isValidEmail(email)) {
      throw new Error("Invalid email address");
    }

    const next = {
      legalName,
      addressLine1: trimToEmpty(args.addressLine1),
      addressLine2: trimToEmpty(args.addressLine2),
      city: trimToEmpty(args.city),
      state: trimToEmpty(args.state),
      country: trimToEmpty(args.country) || DEFAULT_COUNTRY,
      email,
      phone: trimToEmpty(args.phone),
      tin: trimToEmpty(args.tin),
      vatNumber: trimToEmpty(args.vatNumber),
    };

    const existing = await ctx.db
      .query("businessProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...next, updatedAt: now });
    } else {
      await ctx.db.insert("businessProfiles", {
        userId: user._id,
        userExternalId: user.externalId,
        ...next,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (user.companyName !== legalName) {
      await ctx.db.patch(user._id, { companyName: legalName, updatedAt: now });
    }

    return await loadBusinessProfile(ctx, user);
  },
});

// ============================================
// IVA-185: business logo for invoices
// ============================================

/** Logos are capped at 1MB and stored as PNG or JPEG (SVG is rasterised in the browser). */
const LOGO_MAX_BYTES = 1024 * 1024;

export const generateBusinessLogoUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Refuse to delete (or later adopt) a blob another tenant already owns.
 * Actions have no `ctx.db`, so ownership is checked via this query first.
 */
export async function assertLogoStorageAssignableHandler(
  ctx: QueryCtx | MutationCtx,
  args: { storageId: Id<"_storage"> },
): Promise<null> {
  const user = await getCurrentUser(ctx);
  await assertStorageAssignableToUser(ctx, user, args.storageId);
  return null;
}

export const assertLogoStorageAssignable = internalQuery({
  args: { storageId: v.id("_storage") },
  returns: v.null(),
  handler: assertLogoStorageAssignableHandler,
});

export async function discardInvalidLogoUpload(
  ctx: Pick<ActionCtx, "runQuery" | "storage">,
  storageId: Id<"_storage">,
): Promise<void> {
  await ctx.runQuery(internal.tenancy.assertLogoStorageAssignable, {
    storageId,
  });
  await ctx.storage.delete(storageId);
}

/**
 * Validate an uploaded logo (real PNG or JPEG bytes, at most 1MB) and attach it
 * to the caller's business profile. Invalid uploads are deleted.
 */
export const setMyBusinessLogo = action({
  args: { storageId: v.id("_storage") },
  returns: businessProfileApi,
  handler: async (ctx, args): Promise<BusinessProfileApiShape> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    await ctx.runQuery(internal.tenancy.assertLogoStorageAssignable, {
      storageId: args.storageId,
    });
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) throw new Error("Upload not found. Please try again.");
    let problem: string | null = null;
    let meta: ReturnType<typeof sniffImage> = null;
    if (blob.size > LOGO_MAX_BYTES) {
      problem = "Logo must be 1MB or smaller";
    } else {
      meta = sniffImage(new Uint8Array(await blob.arrayBuffer()));
      if (!meta) problem = "Logo must be a PNG, JPG or SVG image";
    }
    if (problem || !meta) {
      await discardInvalidLogoUpload(ctx, args.storageId);
      throw new Error(problem ?? "Logo must be a PNG, JPG or SVG image");
    }
    return await ctx.runMutation(internal.tenancy.saveMyBusinessLogo, {
      storageId: args.storageId,
      width: meta.width,
      height: meta.height,
    });
  },
});

type BusinessProfileApiShape = Awaited<ReturnType<typeof loadBusinessProfile>>;

async function deleteLogoIfUnused(
  ctx: MutationCtx,
  userId: Id<"users">,
  storageId: Id<"_storage">,
) {
  // Issued invoices keep pointing at their logo, so never delete one they use.
  if (await logoUsedOnIssuedInvoice(ctx, userId, storageId)) return;
  await ctx.storage.delete(storageId);
}

export async function saveMyBusinessLogoHandler(
  ctx: MutationCtx,
  args: { storageId: Id<"_storage">; width: number; height: number },
) {
  const user = await getCurrentUser(ctx);
  await assertStorageAssignableToUser(ctx, user, args.storageId);
  const existing = await ctx.db
    .query("businessProfiles")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .unique();
  const now = Date.now();
  const logo = {
    logoStorageId: args.storageId,
    logoWidth: args.width,
    logoHeight: args.height,
    updatedAt: now,
  };
  if (existing) {
    const previous = existing.logoStorageId;
    await ctx.db.patch(existing._id, logo);
    if (previous && previous !== args.storageId) {
      await deleteLogoIfUnused(ctx, user._id, previous);
    }
  } else {
    await ctx.db.insert("businessProfiles", {
      userId: user._id,
      userExternalId: user.externalId,
      ...logo,
      createdAt: now,
    });
  }
  return await loadBusinessProfile(ctx, user);
}

export const saveMyBusinessLogo = internalMutation({
  args: {
    storageId: v.id("_storage"),
    width: v.number(),
    height: v.number(),
  },
  returns: businessProfileApi,
  handler: saveMyBusinessLogoHandler,
});

export const removeMyBusinessLogo = mutation({
  args: {},
  returns: businessProfileApi,
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const existing = await ctx.db
      .query("businessProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existing?.logoStorageId) {
      const previous = existing.logoStorageId;
      await ctx.db.patch(existing._id, {
        logoStorageId: undefined,
        logoWidth: undefined,
        logoHeight: undefined,
        updatedAt: Date.now(),
      });
      await deleteLogoIfUnused(ctx, user._id, previous);
    }
    return await loadBusinessProfile(ctx, user);
  },
});

export const listMyClients = query({
  args: {},
  returns: v.array(clientApi),
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
        const usedOnIssued = await clientHasIssuedInvoices(ctx, client._id);
        clients.push(toClientApi(client, usedOnIssued));
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
      country: DEFAULT_COUNTRY,
      status: "active",
      createdAt: now,
    });
    return { firmId: firmExternalId, clientId: clientExternalId };
  },
});

export const createClient = mutation({
  args: {
    legalName: v.string(),
    ...optionalClientFields,
  },
  returns: clientApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const legalName = args.legalName.trim();
    if (legalName.length < 1) {
      throw new Error("Client name is required");
    }
    if (legalName.length > 200) {
      throw new Error("Client name must be less than 200 characters");
    }
    const email = trimToUndef(args.email);
    if (email && !isValidEmail(email)) {
      throw new Error("Invalid email address");
    }

    const firmId = await getOrCreateUserFirm(ctx, user);
    const clientExternalId = newExternalId();
    const inserted = await ctx.db.insert("clients", {
      externalId: clientExternalId,
      firmId,
      legalName,
      email,
      phone: trimToUndef(args.phone),
      addressLine1: trimToUndef(args.addressLine1),
      addressLine2: trimToUndef(args.addressLine2),
      city: trimToUndef(args.city),
      state: trimToUndef(args.state),
      country: trimToUndef(args.country) ?? DEFAULT_COUNTRY,
      tin: trimToUndef(args.tin),
      status: "active",
      createdAt: Date.now(),
    });
    const client = await ctx.db.get(inserted);
    if (!client) throw new Error("Client not found");
    return toClientApi(client, false);
  },
});

export const updateClient = mutation({
  args: {
    externalId: v.string(),
    legalName: v.optional(v.string()),
    ...optionalClientFields,
  },
  returns: clientApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const client = await ctx.db
      .query("clients")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!client || client.archivedAt) {
      throw new Error("Client not found");
    }
    const membership = await ctx.db
      .query("firmMembers")
      .withIndex("by_firm_and_user", (q) =>
        q.eq("firmId", client.firmId).eq("userId", user._id),
      )
      .unique();
    if (!membership) {
      throw new Error("Unauthorized");
    }

    const legalName = args.legalName !== undefined ? args.legalName.trim() : client.legalName;
    if (legalName.length < 1) {
      throw new Error("Client name is required");
    }
    const email =
      args.email !== undefined ? trimToUndef(args.email) : client.email;
    if (email && !isValidEmail(email)) {
      throw new Error("Invalid email address");
    }

    await ctx.db.patch(client._id, {
      legalName,
      email,
      phone: args.phone !== undefined ? trimToUndef(args.phone) : client.phone,
      addressLine1:
        args.addressLine1 !== undefined
          ? trimToUndef(args.addressLine1)
          : client.addressLine1,
      addressLine2:
        args.addressLine2 !== undefined
          ? trimToUndef(args.addressLine2)
          : client.addressLine2,
      city: args.city !== undefined ? trimToUndef(args.city) : client.city,
      state: args.state !== undefined ? trimToUndef(args.state) : client.state,
      country:
        args.country !== undefined
          ? (trimToUndef(args.country) ?? DEFAULT_COUNTRY)
          : (client.country ?? DEFAULT_COUNTRY),
      tin: args.tin !== undefined ? trimToUndef(args.tin) : client.tin,
    });
    const updated = await ctx.db.get(client._id);
    if (!updated) throw new Error("Client not found");
    const usedOnIssued = await clientHasIssuedInvoices(ctx, updated._id);
    return toClientApi(updated, usedOnIssued);
  },
});

export const archiveClient = mutation({
  args: { externalId: v.string() },
  returns: v.object({
    hidden: v.boolean(),
    used_on_issued: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const client = await ctx.db
      .query("clients")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!client || client.archivedAt) {
      throw new Error("Client not found");
    }
    const membership = await ctx.db
      .query("firmMembers")
      .withIndex("by_firm_and_user", (q) =>
        q.eq("firmId", client.firmId).eq("userId", user._id),
      )
      .unique();
    if (!membership) {
      throw new Error("Unauthorized");
    }
    const usedOnIssued = await clientHasIssuedInvoices(ctx, client._id);
    if (usedOnIssued) {
      await ctx.db.patch(client._id, {
        archivedAt: Date.now(),
        status: "archived",
      });
      return { hidden: true, used_on_issued: true };
    }
    await ctx.db.patch(client._id, {
      archivedAt: Date.now(),
      status: "archived",
    });
    return { hidden: true, used_on_issued: false };
  },
});

export const deleteClient = mutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const client = await ctx.db
      .query("clients")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!client) {
      throw new Error("Client not found");
    }
    const membership = await ctx.db
      .query("firmMembers")
      .withIndex("by_firm_and_user", (q) =>
        q.eq("firmId", client.firmId).eq("userId", user._id),
      )
      .unique();
    if (!membership) {
      throw new Error("Unauthorized");
    }
    const usedOnIssued = await clientHasIssuedInvoices(ctx, client._id);
    if (usedOnIssued) {
      throw new Error("Used on invoices");
    }
    await ctx.db.patch(client._id, {
      archivedAt: Date.now(),
      status: "archived",
    });
    return null;
  },
});
