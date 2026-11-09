import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { getCurrentUser, userCanAccessClient } from "./lib/auth";
import {
  hasLineItems,
  lineItemsFromPatch,
  patchIncludesLines,
  priceInvoiceLines,
} from "./lib/invoiceAmounts";
import {
  allocateNextInvoiceNumber,
  assertInvoiceNumberAvailable,
} from "./lib/invoiceNumbers";
import {
  assertCanCancel,
  assertCanMarkPaid,
  assertNotLocked,
  isLockedInvoice,
  resolvePaidOn,
} from "./lib/invoiceStatus";
import {
  ADD_ITEM_BEFORE_ISSUE,
  ALREADY_ISSUED,
  CANCEL_REASON_REQUIRED,
  FORBIDDEN,
  FORBIDDEN_MESSAGE,
  STATUS_VIA_UPDATE,
} from "./lib/lineAmounts";
import { newExternalId } from "./lib/ids";
import {
  customerInfoFromParty,
  loadBusinessProfile,
  partyFromBusiness,
  partyFromClient,
} from "./lib/profiles";

const invoiceApi = v.object({
  id: v.string(),
  user_id: v.string(),
  client_id: v.union(v.string(), v.null()),
  invoice_number: v.string(),
  title: v.union(v.string(), v.null()),
  invoice_date: v.union(v.string(), v.null()),
  due_date: v.union(v.string(), v.null()),
  tax_year: v.union(v.number(), v.null()),
  customer_info: v.any(),
  sender: v.any(),
  line_items: v.any(),
  subtotal: v.union(v.number(), v.null()),
  vat_amount: v.union(v.number(), v.null()),
  total_amount: v.union(v.number(), v.null()),
  amount_due: v.union(v.number(), v.null()),
  status: v.string(),
  notes: v.union(v.string(), v.null()),
  is_immutable: v.boolean(),
  paid_at: v.union(v.string(), v.null()),
  paid_on: v.union(v.string(), v.null()),
  paid_note: v.union(v.string(), v.null()),
  paid_method: v.union(v.string(), v.null()),
  cancelled_at: v.union(v.string(), v.null()),
  cancel_reason: v.union(v.string(), v.null()),
  created_at: v.string(),
  updated_at: v.string(),
});

function toApi(
  row: {
    externalId: string;
    userExternalId: string;
    clientExternalId?: string;
    invoiceNumber: string;
    title?: string;
    invoiceDate?: string;
    dueDate?: string;
    taxYear?: number;
    customerInfo?: unknown;
    senderSnapshot?: unknown;
    lineItems?: unknown;
    subtotal?: number;
    vatAmount?: number;
    totalAmount?: number;
    amountDue?: number;
    status: string;
    notes?: string;
    isImmutable: boolean;
    paidAt?: number;
    paidOn?: string;
    paidNote?: string;
    paidMethod?: string;
    cancelledAt?: number;
    cancelReason?: string;
    createdAt: number;
    updatedAt: number;
  },
  extras?: { customerInfo?: unknown; sender?: unknown },
) {
  return {
    id: row.externalId,
    user_id: row.userExternalId,
    client_id: row.clientExternalId ?? null,
    invoice_number: row.invoiceNumber,
    title: row.title ?? null,
    invoice_date: row.invoiceDate ?? null,
    due_date: row.dueDate ?? null,
    tax_year: row.taxYear ?? null,
    customer_info: extras?.customerInfo ?? row.customerInfo ?? null,
    sender: extras?.sender ?? row.senderSnapshot ?? null,
    line_items: row.lineItems ?? null,
    subtotal: row.subtotal ?? null,
    vat_amount: row.vatAmount ?? null,
    total_amount: row.totalAmount ?? null,
    amount_due: row.amountDue ?? row.totalAmount ?? null,
    status: row.status,
    notes: row.notes ?? null,
    is_immutable: row.isImmutable,
    paid_at: row.paidAt ? new Date(row.paidAt).toISOString() : null,
    paid_on: row.paidOn ?? null,
    paid_note: row.paidNote ?? null,
    paid_method: row.paidMethod ?? null,
    cancelled_at: row.cancelledAt
      ? new Date(row.cancelledAt).toISOString()
      : null,
    cancel_reason: row.cancelReason ?? null,
    created_at: new Date(row.createdAt).toISOString(),
    updated_at: new Date(row.updatedAt).toISOString(),
  };
}

async function hydrateInvoice(
  ctx: Parameters<typeof getCurrentUser>[0],
  row: {
    externalId: string;
    userExternalId: string;
    clientId?: import("./_generated/dataModel").Id<"clients">;
    clientExternalId?: string;
    invoiceNumber: string;
    title?: string;
    invoiceDate?: string;
    dueDate?: string;
    taxYear?: number;
    customerInfo?: unknown;
    senderSnapshot?: unknown;
    lineItems?: unknown;
    subtotal?: number;
    vatAmount?: number;
    totalAmount?: number;
    amountDue?: number;
    status: string;
    notes?: string;
    isImmutable: boolean;
    paidAt?: number;
    paidOn?: string;
    paidNote?: string;
    paidMethod?: string;
    cancelledAt?: number;
    cancelReason?: string;
    createdAt: number;
    updatedAt: number;
  },
  user: Awaited<ReturnType<typeof getCurrentUser>>,
) {
  const issued =
    isLockedInvoice(row) ||
    row.status === "issued" ||
    row.status === "paid" ||
    row.status === "cancelled";
  if (issued) {
    return toApi(row, {
      customerInfo: row.customerInfo,
      sender: row.senderSnapshot,
    });
  }

  const profile = await loadBusinessProfile(ctx, user);
  const sender = partyFromBusiness(profile);
  let customerInfo = row.customerInfo ?? null;
  if (row.clientId) {
    const client = await ctx.db.get(row.clientId);
    if (client) {
      customerInfo = customerInfoFromParty(partyFromClient(client));
    }
  } else {
    customerInfo = null;
  }
  return toApi(row, { customerInfo, sender });
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
    const out = [];
    for (const row of filtered) {
      out.push(await hydrateInvoice(ctx, row, user));
    }
    return out;
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
    return await hydrateInvoice(ctx, row, user);
  },
});

async function loadOwnedInvoice(
  ctx: MutationCtx,
  externalId: string,
  user: Doc<"users">,
) {
  const row = await ctx.db
    .query("invoices")
    .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
    .unique();
  if (!row) throw new Error("Invoice not found");
  if (row.userId !== user._id) {
    throw new ConvexError({ code: FORBIDDEN, message: FORBIDDEN_MESSAGE });
  }
  return row;
}

async function writeStatusAudit(
  ctx: MutationCtx,
  args: {
    invoiceId: Id<"invoices">;
    clientId?: Id<"clients">;
    userId: Id<"users">;
    action: string;
    from: string;
    to: string;
    createdAt: number;
    details?: Record<string, unknown>;
  },
) {
  await ctx.db.insert("invoiceAuditLogs", {
    invoiceId: args.invoiceId,
    clientId: args.clientId,
    userId: args.userId,
    action: args.action,
    details: { from: args.from, to: args.to, ...args.details },
    createdAt: args.createdAt,
  });
}

export async function nextNumberHandler(
  ctx: MutationCtx,
  args: { clientExternalId?: string; taxYear: number },
) {
  const user = await getCurrentUser(ctx);
  // clientExternalId is ignored: sequences are owner-scoped so one seller
  // cannot bump another seller's counter.
  void args.clientExternalId;
  return await allocateNextInvoiceNumber(ctx, user._id, args.taxYear);
}

export const nextNumber = mutation({
  args: {
    clientExternalId: v.optional(v.string()),
    taxYear: v.number(),
  },
  returns: v.string(),
  handler: nextNumberHandler,
});

type CreateMineArgs = {
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  taxYear?: number;
  clientExternalId?: string;
  title?: string;
  customerInfo?: unknown;
  lineItems?: unknown;
  subtotal?: number;
  vatAmount?: number;
  totalAmount?: number;
  status?: string;
  notes?: string;
};

export async function createMineHandler(ctx: MutationCtx, args: CreateMineArgs) {
  const user = await getCurrentUser(ctx);
  // IVA-190: ignore client-sent line amounts and totals.
  const priced = priceInvoiceLines(args.lineItems);
  const amountFields = priced.hasLines
    ? {
        lineItems: priced.lineItems,
        subtotal: priced.subtotal,
        vatAmount: priced.vatAmount,
        discountAmount: priced.discountAmount,
        totalAmount: priced.totalAmount,
        amountDue: priced.totalAmount,
      }
    : {
        lineItems: priced.lineItems,
        subtotal: 0,
        vatAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        amountDue: 0,
      };
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
  const invoiceNumber = args.invoiceNumber
    ? await assertInvoiceNumberAvailable(ctx, user._id, args.invoiceNumber)
    : await allocateNextInvoiceNumber(ctx, user._id, year);
  const now = Date.now();
  const externalId = newExternalId();
  await ctx.db.insert("invoices", {
    externalId,
    userId: user._id,
    userExternalId: user.externalId,
    clientId,
    clientExternalId: args.clientExternalId,
    invoiceNumber,
    title: args.title,
    invoiceDate: args.invoiceDate,
    dueDate: args.dueDate,
    taxYear: year,
    customerInfo: args.customerInfo,
    ...amountFields,
    status: "draft",
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
  return await hydrateInvoice(ctx, row, user);
}

export const createMine = mutation({
  args: {
    invoiceNumber: v.optional(v.string()),
    invoiceDate: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    taxYear: v.optional(v.number()),
    clientExternalId: v.optional(v.string()),
    title: v.optional(v.string()),
    customerInfo: v.optional(v.any()),
    lineItems: v.optional(v.any()),
    subtotal: v.optional(v.number()),
    vatAmount: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: invoiceApi,
  handler: createMineHandler,
});

type UpdateMineArgs = {
  externalId: string;
  patch: unknown;
};

export async function updateMineHandler(ctx: MutationCtx, args: UpdateMineArgs) {
  const user = await getCurrentUser(ctx);
  const row = await loadOwnedInvoice(ctx, args.externalId, user);
  assertNotLocked(row);
  const patch = (args.patch ?? {}) as Record<string, unknown>;
  // Status transitions to issued (or any other status) only go through issueMine.
  if ("status" in patch) {
    throw new ConvexError(STATUS_VIA_UPDATE);
  }
  let invoiceNumber = row.invoiceNumber;
  if (typeof patch.invoiceNumber === "string") {
    invoiceNumber = await assertInvoiceNumberAvailable(
      ctx,
      user._id,
      patch.invoiceNumber,
      row._id,
    );
  }
  // IVA-190: only reprice when the patch includes lines. Title, notes and
  // client edits leave stored totals alone, including empty-line drafts.
  const priced = patchIncludesLines(patch)
    ? priceInvoiceLines(lineItemsFromPatch(patch, undefined))
    : null;

  let clientId = row.clientId;
  let clientExternalId = row.clientExternalId;
  let customerInfo = row.customerInfo;
  if (typeof patch.clientExternalId === "string" && patch.clientExternalId) {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", patch.clientExternalId as string),
      )
      .unique();
    if (!client) throw new Error("Client not found");
    const ok = await userCanAccessClient(ctx, client._id);
    if (!ok) throw new Error("Unauthorized");
    clientId = client._id;
    clientExternalId = client.externalId;
    customerInfo = customerInfoFromParty(partyFromClient(client));
  } else if (patch.clientExternalId === null) {
    clientId = undefined;
    clientExternalId = undefined;
    customerInfo = undefined;
  }

  const amountPatch =
    priced == null
      ? {}
      : priced.hasLines
        ? {
            lineItems: priced.lineItems,
            subtotal: priced.subtotal,
            vatAmount: priced.vatAmount,
            discountAmount: priced.discountAmount,
            totalAmount: priced.totalAmount,
            amountDue: priced.totalAmount,
          }
        : { lineItems: priced.lineItems };

  await ctx.db.patch(row._id, {
    notes: typeof patch.notes === "string" ? patch.notes : row.notes,
    title: typeof patch.title === "string" ? patch.title : row.title,
    invoiceNumber,
    clientId,
    clientExternalId,
    customerInfo,
    ...amountPatch,
    updatedAt: Date.now(),
  });
  const updated = await ctx.db.get(row._id);
  if (!updated) throw new Error("Invoice not found");
  return await hydrateInvoice(ctx, updated, user);
}

export const updateMine = mutation({
  args: {
    externalId: v.string(),
    patch: v.object({
      title: v.optional(v.string()),
      notes: v.optional(v.string()),
      invoiceNumber: v.optional(v.string()),
      clientExternalId: v.optional(v.union(v.string(), v.null())),
      lineItems: v.optional(v.any()),
      line_items: v.optional(v.any()),
    }),
  },
  returns: invoiceApi,
  handler: updateMineHandler,
});

export async function issueMineHandler(
  ctx: MutationCtx,
  args: { externalId: string },
) {
  const user = await getCurrentUser(ctx);
  const row = await loadOwnedInvoice(ctx, args.externalId, user);
  if (row.isImmutable || row.status === "issued" || row.status === "paid") {
    throw new ConvexError(ALREADY_ISSUED);
  }
  if (row.status === "cancelled") {
    throw new ConvexError(ALREADY_ISSUED);
  }
  await assertInvoiceNumberAvailable(
    ctx,
    user._id,
    row.invoiceNumber,
    row._id,
  );

  if (!row.clientId) {
    throw new Error("Select a client before issuing");
  }
  const client = await ctx.db.get(row.clientId);
  if (!client) {
    throw new Error("Select a client before issuing");
  }

  const profile = await loadBusinessProfile(ctx, user);
  if (!profile.legalName.trim()) {
    throw new Error("Add your business name in Settings before issuing");
  }

  if (!hasLineItems(row.lineItems)) {
    throw new ConvexError(ADD_ITEM_BEFORE_ISSUE);
  }

  const senderSnapshot = partyFromBusiness(profile);
  const customerInfo = customerInfoFromParty(partyFromClient(client));
  const priced = priceInvoiceLines(row.lineItems);
  const now = Date.now();
  const fromStatus = row.status;
  await ctx.db.patch(row._id, {
    status: "issued",
    isImmutable: true,
    issuedAt: now,
    updatedAt: now,
    senderSnapshot,
    customerInfo,
    lineItems: priced.lineItems,
    subtotal: priced.subtotal,
    vatAmount: priced.vatAmount,
    discountAmount: priced.discountAmount,
    totalAmount: priced.totalAmount,
    amountDue: priced.totalAmount,
  });
  await writeStatusAudit(ctx, {
    invoiceId: row._id,
    clientId: row.clientId,
    userId: user._id,
    action: "issue",
    from: fromStatus,
    to: "issued",
    createdAt: now,
  });
  const updated = await ctx.db.get(row._id);
  if (!updated) throw new Error("Invoice not found");
  return await hydrateInvoice(ctx, updated, user);
}

type MarkPaidArgs = {
  externalId: string;
  paidOn?: string;
  note?: string;
  method?: string;
};

export async function markPaidMineHandler(ctx: MutationCtx, args: MarkPaidArgs) {
  const user = await getCurrentUser(ctx);
  const row = await loadOwnedInvoice(ctx, args.externalId, user);
  assertCanMarkPaid(row);
  const paid = resolvePaidOn(args.paidOn);
  const note = args.note?.trim() || undefined;
  const method = args.method?.trim() || undefined;
  const now = Date.now();
  const fromStatus = row.status;
  await ctx.db.patch(row._id, {
    status: "paid",
    isImmutable: true,
    paidAt: paid.paidAt,
    paidOn: paid.paidOn,
    paidNote: note,
    paidMethod: method,
    amountDue: 0,
    updatedAt: now,
  });
  await writeStatusAudit(ctx, {
    invoiceId: row._id,
    clientId: row.clientId,
    userId: user._id,
    action: "paid",
    from: fromStatus,
    to: "paid",
    createdAt: now,
    details: {
      paidAt: paid.paidAt,
      paidOn: paid.paidOn,
      note,
      method,
    },
  });
  const updated = await ctx.db.get(row._id);
  if (!updated) throw new Error("Invoice not found");
  return await hydrateInvoice(ctx, updated, user);
}

export const markPaidMine = mutation({
  args: {
    externalId: v.string(),
    paidOn: v.optional(v.string()),
    note: v.optional(v.string()),
    method: v.optional(v.string()),
  },
  returns: invoiceApi,
  handler: markPaidMineHandler,
});

type CancelMineArgs = {
  externalId: string;
  reason: string;
};

export async function cancelMineHandler(ctx: MutationCtx, args: CancelMineArgs) {
  const user = await getCurrentUser(ctx);
  const row = await loadOwnedInvoice(ctx, args.externalId, user);
  assertCanCancel(row);
  const reason = args.reason.trim();
  if (!reason) {
    throw new ConvexError(CANCEL_REASON_REQUIRED);
  }
  const now = Date.now();
  const fromStatus = row.status;
  await ctx.db.patch(row._id, {
    status: "cancelled",
    isImmutable: true,
    cancelledAt: now,
    cancelReason: reason,
    updatedAt: now,
  });
  await writeStatusAudit(ctx, {
    invoiceId: row._id,
    clientId: row.clientId,
    userId: user._id,
    action: "cancelled",
    from: fromStatus,
    to: "cancelled",
    createdAt: now,
    details: { reason },
  });
  const updated = await ctx.db.get(row._id);
  if (!updated) throw new Error("Invoice not found");
  return await hydrateInvoice(ctx, updated, user);
}

export const cancelMine = mutation({
  args: {
    externalId: v.string(),
    reason: v.string(),
  },
  returns: invoiceApi,
  handler: cancelMineHandler,
});

export const issueMine = mutation({
  args: { externalId: v.string() },
  returns: invoiceApi,
  handler: issueMineHandler,
});

export const removeMine = mutation({
  args: { externalId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await loadOwnedInvoice(ctx, args.externalId, user);
    if (isLockedInvoice(row) || row.status !== "draft") {
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

export const archiveMine = mutation({
  args: {
    externalId: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    archive_id: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await loadOwnedInvoice(ctx, args.externalId, user);
    const existing = await ctx.db
      .query("invoiceArchives")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", row._id))
      .first();
    if (existing) {
      return { success: true, archive_id: existing.externalId };
    }
    const now = Date.now();
    const externalId = newExternalId();
    await ctx.db.insert("invoiceArchives", {
      externalId,
      invoiceId: row._id,
      clientId: row.clientId,
      snapshot: {
        invoice: toApi(row),
        reason: args.reason ?? "Manual archive",
        archivedAt: now,
      },
      createdAt: now,
    });
    await ctx.db.patch(row._id, {
      status: "archived",
      isImmutable: true,
      updatedAt: now,
    });
    await ctx.db.insert("invoiceAuditLogs", {
      invoiceId: row._id,
      clientId: row.clientId,
      userId: user._id,
      action: "archived",
      details: { reason: args.reason ?? "Manual archive" },
      createdAt: now,
    });
    return { success: true, archive_id: externalId };
  },
});

export const getArchiveMine = query({
  args: { invoiceExternalId: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const invoice = await ctx.db
      .query("invoices")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", args.invoiceExternalId),
      )
      .unique();
    if (!invoice || invoice.userId !== user._id) return null;
    const archive = await ctx.db
      .query("invoiceArchives")
      .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
      .first();
    return archive?.snapshot ?? null;
  },
});

export const listArchivesMine = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      created_at: v.string(),
      snapshot: v.any(),
    }),
  ),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const out = [];
    for (const invoice of invoices) {
      const archive = await ctx.db
        .query("invoiceArchives")
        .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
        .first();
      if (!archive) continue;
      out.push({
        id: archive.externalId,
        created_at: new Date(archive.createdAt).toISOString(),
        snapshot: archive.snapshot,
      });
    }
    return out;
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
