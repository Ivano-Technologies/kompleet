import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, userCanAccessClient } from "./lib/auth";
import { newExternalId } from "./lib/ids";

const invoiceApi = v.object({
  id: v.string(),
  user_id: v.string(),
  client_id: v.union(v.string(), v.null()),
  invoice_number: v.string(),
  invoice_date: v.union(v.string(), v.null()),
  due_date: v.union(v.string(), v.null()),
  tax_year: v.union(v.number(), v.null()),
  customer_info: v.any(),
  line_items: v.any(),
  subtotal: v.union(v.number(), v.null()),
  vat_amount: v.union(v.number(), v.null()),
  total_amount: v.union(v.number(), v.null()),
  amount_due: v.union(v.number(), v.null()),
  status: v.string(),
  notes: v.union(v.string(), v.null()),
  is_immutable: v.boolean(),
  created_at: v.string(),
  updated_at: v.string(),
});

function toApi(row: {
  externalId: string;
  userExternalId: string;
  clientExternalId?: string;
  invoiceNumber: string;
  invoiceDate?: string;
  dueDate?: string;
  taxYear?: number;
  customerInfo?: unknown;
  lineItems?: unknown;
  subtotal?: number;
  vatAmount?: number;
  totalAmount?: number;
  amountDue?: number;
  status: string;
  notes?: string;
  isImmutable: boolean;
  createdAt: number;
  updatedAt: number;
}) {
  return {
    id: row.externalId,
    user_id: row.userExternalId,
    client_id: row.clientExternalId ?? null,
    invoice_number: row.invoiceNumber,
    invoice_date: row.invoiceDate ?? null,
    due_date: row.dueDate ?? null,
    tax_year: row.taxYear ?? null,
    customer_info: row.customerInfo ?? null,
    line_items: row.lineItems ?? null,
    subtotal: row.subtotal ?? null,
    vat_amount: row.vatAmount ?? null,
    total_amount: row.totalAmount ?? null,
    amount_due: row.amountDue ?? row.totalAmount ?? null,
    status: row.status,
    notes: row.notes ?? null,
    is_immutable: row.isImmutable,
    created_at: new Date(row.createdAt).toISOString(),
    updated_at: new Date(row.updatedAt).toISOString(),
  };
}

export const listMine = query({
  args: {
    status: v.optional(v.string()),
    taxYear: v.optional(v.number()),
  },
  returns: v.array(invoiceApi),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("invoices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const filtered = rows.filter((r) => {
      if (args.status && r.status !== args.status) return false;
      if (args.taxYear !== undefined && r.taxYear !== args.taxYear) return false;
      return true;
    });
    return filtered.map(toApi);
  },
});

export const getMine = query({
  args: { externalId: v.string() },
  returns: v.union(invoiceApi, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("invoices")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) return null;
    return toApi(row);
  },
});

export const nextNumber = mutation({
  args: {
    clientExternalId: v.optional(v.string()),
    taxYear: v.number(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const existing = await ctx.db
      .query("invoiceSequences")
      .withIndex("by_client_and_year", (q) =>
        q.eq("clientExternalId", args.clientExternalId).eq("taxYear", args.taxYear),
      )
      .unique();
    const next = (existing?.nextNumber ?? 1);
    if (existing) {
      await ctx.db.patch(existing._id, { nextNumber: next + 1 });
    } else {
      await ctx.db.insert("invoiceSequences", {
        clientExternalId: args.clientExternalId,
        taxYear: args.taxYear,
        nextNumber: next + 1,
      });
    }
    return `INV-${args.taxYear}-${String(next).padStart(4, "0")}`;
  },
});

export const createMine = mutation({
  args: {
    invoiceNumber: v.optional(v.string()),
    invoiceDate: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    taxYear: v.optional(v.number()),
    clientExternalId: v.optional(v.string()),
    customerInfo: v.optional(v.any()),
    lineItems: v.optional(v.any()),
    subtotal: v.optional(v.number()),
    vatAmount: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: invoiceApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    let clientId;
    if (args.clientExternalId) {
      const client = await ctx.db
        .query("clients")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", args.clientExternalId!),
        )
        .unique();
      if (client) {
        const ok = await userCanAccessClient(ctx, client._id);
        if (!ok) throw new Error("Unauthorized");
        clientId = client._id;
      }
    }
    const year = args.taxYear ?? new Date().getFullYear();
    const invoiceNumber =
      args.invoiceNumber ??
      (await (async () => {
        const existing = await ctx.db
          .query("invoiceSequences")
          .withIndex("by_client_and_year", (q) =>
            q
              .eq("clientExternalId", args.clientExternalId)
              .eq("taxYear", year),
          )
          .unique();
        const next = existing?.nextNumber ?? 1;
        if (existing) {
          await ctx.db.patch(existing._id, { nextNumber: next + 1 });
        } else {
          await ctx.db.insert("invoiceSequences", {
            clientExternalId: args.clientExternalId,
            taxYear: year,
            nextNumber: next + 1,
          });
        }
        return `INV-${year}-${String(next).padStart(4, "0")}`;
      })());
    const now = Date.now();
    const externalId = newExternalId();
    await ctx.db.insert("invoices", {
      externalId,
      userId: user._id,
      userExternalId: user.externalId,
      clientId,
      clientExternalId: args.clientExternalId,
      invoiceNumber,
      invoiceDate: args.invoiceDate,
      dueDate: args.dueDate,
      taxYear: year,
      customerInfo: args.customerInfo,
      lineItems: args.lineItems,
      subtotal: args.subtotal,
      vatAmount: args.vatAmount,
      totalAmount: args.totalAmount,
      amountDue: args.totalAmount,
      status: args.status ?? "draft",
      notes: args.notes,
      isImmutable: false,
      createdAt: now,
      updatedAt: now,
    });
    const row = await ctx.db
      .query("invoices")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    if (!row) throw new Error("Invoice not found");
    await ctx.db.insert("invoiceAuditLogs", {
      invoiceId: row._id,
      clientId,
      userId: user._id,
      action: "create",
      createdAt: now,
    });
    return toApi(row);
  },
});

export const updateMine = mutation({
  args: {
    externalId: v.string(),
    patch: v.any(),
  },
  returns: invoiceApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("invoices")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) throw new Error("Invoice not found");
    if (row.isImmutable) throw new Error("Invoice is immutable");
    const patch = args.patch as Record<string, unknown>;
    await ctx.db.patch(row._id, {
      status: typeof patch.status === "string" ? patch.status : row.status,
      notes: typeof patch.notes === "string" ? patch.notes : row.notes,
      updatedAt: Date.now(),
    });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Invoice not found");
    return toApi(updated);
  },
});

export const issueMine = mutation({
  args: { externalId: v.string() },
  returns: invoiceApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("invoices")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) throw new Error("Invoice not found");
    const now = Date.now();
    await ctx.db.patch(row._id, {
      status: "issued",
      isImmutable: true,
      issuedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("invoiceAuditLogs", {
      invoiceId: row._id,
      clientId: row.clientId,
      userId: user._id,
      action: "issue",
      createdAt: now,
    });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("Invoice not found");
    return toApi(updated);
  },
});

export const removeMine = mutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("invoices")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();
    if (!row || row.userId !== user._id) throw new Error("Invoice not found");
    if (row.isImmutable || row.status !== "draft") {
      throw new Error("Only draft invoices can be deleted");
    }
    await ctx.db.delete(row._id);
    return null;
  },
});

export const getSigningKeys = query({
  args: { clientExternalId: v.string() },
  returns: v.union(
    v.object({
      public_key: v.string(),
      private_key_encrypted: v.string(),
      key_type: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", args.clientExternalId),
      )
      .unique();
    if (!client) return null;
    const ok = await userCanAccessClient(ctx, client._id);
    if (!ok) throw new Error("Unauthorized");
    const keys = await ctx.db
      .query("clientKeys")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .unique();
    if (!keys) return null;
    return {
      public_key: keys.publicKey,
      private_key_encrypted: keys.privateKeyEncrypted,
      key_type: keys.keyType,
    };
  },
});

export const upsertSigningKeys = mutation({
  args: {
    clientExternalId: v.string(),
    publicKey: v.string(),
    privateKeyEncrypted: v.string(),
    keyType: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", args.clientExternalId),
      )
      .unique();
    if (!client) throw new Error("Client not found");
    const ok = await userCanAccessClient(ctx, client._id);
    if (!ok) throw new Error("Unauthorized");
    const existing = await ctx.db
      .query("clientKeys")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        publicKey: args.publicKey,
        privateKeyEncrypted: args.privateKeyEncrypted,
        keyType: args.keyType,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("clientKeys", {
        clientId: client._id,
        clientExternalId: client.externalId,
        publicKey: args.publicKey,
        privateKeyEncrypted: args.privateKeyEncrypted,
        keyType: args.keyType,
        updatedAt: now,
      });
    }
    return null;
  },
});
