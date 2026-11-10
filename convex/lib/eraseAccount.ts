import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Phrase the signed-in user must type in Settings to erase their account. */
export const DELETE_ACCOUNT_PHRASE = "delete my account";

export const ANON_NAME = "Deleted user";

/** Issued invoices are kept this many years as tax records. */
export const ISSUED_INVOICE_RETENTION_YEARS = 6;

export const ACCOUNT_ERASED_ACTION = "account_erased";

export const RETENTION_NOTE =
  "Issued invoices are kept for six years as tax records. Names and addresses on those invoices are replaced with a placeholder.";

export const ANON_PARTY = {
  name: ANON_NAME,
  email: "",
  phone: "",
};

export function shouldKeepInvoice(status: string): boolean {
  return status !== "draft";
}

export function anonymisedEmail(externalId: string): string {
  return `deleted-${externalId}@deleted.invalid`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function anonymiseParty(value: unknown): typeof ANON_PARTY {
  void value;
  return { ...ANON_PARTY };
}

export function anonymiseArchiveSnapshot(snapshot: unknown): unknown {
  const root = asRecord(snapshot);
  if (!root) return { invoice: { customer_info: ANON_PARTY, sender: ANON_PARTY } };
  const invoice = asRecord(root.invoice);
  return {
    ...root,
    customerInfo: ANON_PARTY,
    customer_info: ANON_PARTY,
    sender: ANON_PARTY,
    senderSnapshot: ANON_PARTY,
    invoice: invoice
      ? {
          ...invoice,
          customer_info: ANON_PARTY,
          customerInfo: ANON_PARTY,
          sender: ANON_PARTY,
        }
      : { customer_info: ANON_PARTY, sender: ANON_PARTY },
  };
}

async function deleteStorage(
  ctx: MutationCtx,
  storageId: Id<"_storage"> | undefined,
) {
  if (!storageId) return;
  await ctx.storage.delete(storageId);
}

async function deleteRows(
  ctx: MutationCtx,
  rows: Array<{ _id: Id<never> } | { _id: string }>,
) {
  for (const row of rows) {
    await ctx.db.delete(row._id as Id<never>);
  }
}

async function deleteByUserId(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  const transactions = await ctx.db
    .query("transactions")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  await deleteRows(ctx, transactions);
  const taxCalculations = await ctx.db
    .query("taxCalculations")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  await deleteRows(ctx, taxCalculations);
  const financialStatements = await ctx.db
    .query("financialStatements")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  await deleteRows(ctx, financialStatements);
  const taxReports = await ctx.db
    .query("taxReports")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  await deleteRows(ctx, taxReports);
  const userTaxYears = await ctx.db
    .query("userTaxYears")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  await deleteRows(ctx, userTaxYears);
  const duplicateCandidates = await ctx.db
    .query("duplicateCandidates")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  await deleteRows(ctx, duplicateCandidates);
  const expenseCategories = await ctx.db
    .query("expenseCategories")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  await deleteRows(ctx, expenseCategories);
  const filingAuditLogs = await ctx.db
    .query("filingAuditLogs")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  await deleteRows(ctx, filingAuditLogs);
}

async function deleteInvoiceTree(
  ctx: MutationCtx,
  invoiceId: Id<"invoices">,
) {
  const archives = await ctx.db
    .query("invoiceArchives")
    .withIndex("by_invoice", (q) => q.eq("invoiceId", invoiceId))
    .collect();
  await deleteRows(ctx, archives);
  const logs = await ctx.db
    .query("invoiceAuditLogs")
    .withIndex("by_invoice", (q) => q.eq("invoiceId", invoiceId))
    .collect();
  await deleteRows(ctx, logs);
  await ctx.db.delete(invoiceId);
}

async function anonymiseKeptInvoice(
  ctx: MutationCtx,
  invoice: Doc<"invoices">,
) {
  await ctx.db.patch(invoice._id, {
    customerInfo: ANON_PARTY,
    senderSnapshot: ANON_PARTY,
    notes: undefined,
    updatedAt: Date.now(),
  });
  const archives = await ctx.db
    .query("invoiceArchives")
    .withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
    .collect();
  for (const archive of archives) {
    await ctx.db.patch(archive._id, {
      snapshot: anonymiseArchiveSnapshot(archive.snapshot),
    });
  }
}

async function eraseOwnedClients(
  ctx: MutationCtx,
  user: Doc<"users">,
  keepClientIds: Set<string>,
) {
  const ownedFirms = await ctx.db
    .query("firms")
    .withIndex("by_ownerUserId", (q) => q.eq("ownerUserId", user._id))
    .collect();
  for (const firm of ownedFirms) {
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_firm", (q) => q.eq("firmId", firm._id))
      .collect();
    for (const client of clients) {
      if (keepClientIds.has(client._id)) {
        await ctx.db.patch(client._id, {
          legalName: ANON_NAME,
          tin: undefined,
          rcNumber: undefined,
          address: undefined,
          addressLine1: undefined,
          addressLine2: undefined,
          city: undefined,
          state: undefined,
          email: undefined,
          phone: undefined,
        });
        continue;
      }
      const keys = await ctx.db
        .query("clientKeys")
        .withIndex("by_client", (q) => q.eq("clientId", client._id))
        .collect();
      await deleteRows(ctx, keys);
      await ctx.db.delete(client._id);
    }
    await ctx.db.patch(firm._id, { name: "Deleted firm" });
  }
}

async function eraseAuth(ctx: MutationCtx, user: Doc<"users">) {
  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", user._id))
    .collect();
  for (const session of sessions) {
    const tokens = await ctx.db
      .query("authRefreshTokens")
      .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
      .collect();
    await deleteRows(ctx, tokens);
    await ctx.db.delete(session._id);
  }
  const accounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
    .collect();
  for (const account of accounts) {
    const codes = await ctx.db
      .query("authVerificationCodes")
      .withIndex("accountId", (q) => q.eq("accountId", account._id))
      .collect();
    await deleteRows(ctx, codes);
    await ctx.db.delete(account._id);
  }
  if (user.email) {
    const limits = await ctx.db
      .query("authRateLimits")
      .withIndex("identifier", (q) => q.eq("identifier", user.email))
      .collect();
    await deleteRows(ctx, limits);
  }
}

async function eraseUserScoped(
  ctx: MutationCtx,
  user: Doc<"users">,
) {
  const files = await ctx.db
    .query("uploadedFiles")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  for (const file of files) {
    await deleteStorage(ctx, file.storageId);
    await ctx.db.delete(file._id);
  }

  const documents = await ctx.db
    .query("documents")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  for (const doc of documents) {
    await deleteStorage(ctx, doc.storageId);
    await ctx.db.delete(doc._id);
  }

  const expenses = await ctx.db
    .query("expenses")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  for (const expense of expenses) {
    await deleteStorage(ctx, expense.receiptStorageId);
    await ctx.db.delete(expense._id);
  }

  const exports = await ctx.db
    .query("exportHistory")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  for (const row of exports) {
    await deleteStorage(ctx, row.storageId);
    await ctx.db.delete(row._id);
  }

  const sessions = await ctx.db
    .query("importSessions")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  for (const session of sessions) {
    await deleteStorage(ctx, session.storageId);
    const errors = await ctx.db
      .query("importErrors")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();
    await deleteRows(ctx, errors);
    await ctx.db.delete(session._id);
  }

  await deleteByUserId(ctx, user._id);

  const forms = await ctx.db
    .query("nrsForms")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  for (const form of forms) {
    const statuses = await ctx.db
      .query("formFilingStatuses")
      .withIndex("by_form", (q) => q.eq("formId", form._id))
      .collect();
    await deleteRows(ctx, statuses);
    await ctx.db.delete(form._id);
  }

  const profiles = await ctx.db
    .query("businessProfiles")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  for (const profile of profiles) {
    await deleteStorage(ctx, profile.logoStorageId);
    await ctx.db.delete(profile._id);
  }

  await deleteStorage(ctx, user.avatarStorageId);

  const memberships = await ctx.db
    .query("firmMembers")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  await deleteRows(ctx, memberships);

  const deadlineReminders = await ctx.db
    .query("deadlineReminders")
    .withIndex("by_user_and_key", (q) => q.eq("userId", user._id))
    .collect();
  await deleteRows(ctx, deadlineReminders);
}

export async function eraseMineHandler(
  ctx: MutationCtx,
  user: Doc<"users">,
): Promise<{ erased: true; keptInvoices: number }> {
  const now = Date.now();
  const invoices = await ctx.db
    .query("invoices")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .collect();
  const keepClientIds = new Set<string>();
  let keptInvoices = 0;
  for (const invoice of invoices) {
    if (shouldKeepInvoice(invoice.status)) {
      await anonymiseKeptInvoice(ctx, invoice);
      if (invoice.clientId) keepClientIds.add(invoice.clientId);
      keptInvoices += 1;
    } else {
      await deleteInvoiceTree(ctx, invoice._id);
    }
  }

  await eraseOwnedClients(ctx, user, keepClientIds);
  await eraseUserScoped(ctx, user);

  const priorAudit = await ctx.db
    .query("auditLogs")
    .withIndex("by_userExternalId", (q) =>
      q.eq("userExternalId", user.externalId),
    )
    .collect();
  await deleteRows(ctx, priorAudit);

  await ctx.db.insert("auditLogs", {
    userId: user._id,
    userExternalId: user.externalId,
    action: ACCOUNT_ERASED_ACTION,
    resourceType: "users",
    entityType: "users",
    entityId: user.externalId,
    metadata: {
      retentionYears: ISSUED_INVOICE_RETENTION_YEARS,
      note: RETENTION_NOTE,
      keptInvoices,
    },
    createdAt: now,
  });

  await eraseAuth(ctx, user);

  await ctx.db.patch(user._id, {
    email: anonymisedEmail(user.externalId),
    name: ANON_NAME,
    fullName: ANON_NAME,
    phone: "",
    tin: undefined,
    companyName: undefined,
    rcNumber: undefined,
    companyAddress: undefined,
    image: undefined,
    avatarStorageId: undefined,
    tokenIdentifier: undefined,
    emailVerificationTime: undefined,
    deletedAt: now,
    updatedAt: now,
  });

  return { erased: true, keptInvoices };
}
