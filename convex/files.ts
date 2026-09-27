import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { newExternalId } from "./lib/ids";

const MAX_BYTES = 10 * 1024 * 1024;
const LIBRARY_TAKE = 300;
const SEARCH_SCAN = 80;

const linkTypeValidator = v.union(
  v.literal("transaction"),
  v.literal("invoice"),
  v.literal("expense"),
);

const sourceValidator = v.union(
  v.literal("documents"),
  v.literal("invoice_drop"),
  v.literal("expense_attach"),
  v.literal("transaction_attach"),
);

const filterValidator = v.union(
  v.literal("all"),
  v.literal("pdf"),
  v.literal("images"),
  v.literal("csv"),
  v.literal("attached"),
  v.literal("unattached"),
);

const fileKindValidator = v.union(
  v.literal("pdf"),
  v.literal("image"),
  v.literal("csv"),
  v.literal("other"),
);

const fileApi = v.object({
  id: v.string(),
  storageId: v.id("_storage"),
  filename: v.string(),
  contentType: v.string(),
  size: v.number(),
  uploadedAt: v.number(),
  source: sourceValidator,
  kind: fileKindValidator,
  linkType: v.union(linkTypeValidator, v.null()),
  linkId: v.union(v.string(), v.null()),
  linkLabel: v.union(v.string(), v.null()),
});

const linkTargetApi = v.object({
  id: v.string(),
  label: v.string(),
  amount: v.union(v.number(), v.null()),
  date: v.union(v.string(), v.null()),
  href: v.string(),
});

type LinkType = "transaction" | "invoice" | "expense";
type FileKind = "pdf" | "image" | "csv" | "other";
type FileFilter =
  | "all"
  | "pdf"
  | "images"
  | "csv"
  | "attached"
  | "unattached";

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".csv",
  ".xlsx",
  ".xls",
] as const;

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot).toLowerCase();
}

function fileKind(filename: string, contentType: string): FileKind {
  const ext = extensionOf(filename);
  const mime = contentType.toLowerCase();
  if (ext === ".pdf" || mime === "application/pdf") return "pdf";
  if (
    ext === ".png" ||
    ext === ".jpg" ||
    ext === ".jpeg" ||
    ext === ".webp" ||
    mime.startsWith("image/")
  ) {
    return "image";
  }
  if (
    ext === ".csv" ||
    ext === ".xlsx" ||
    ext === ".xls" ||
    mime === "text/csv" ||
    mime.includes("spreadsheet")
  ) {
    return "csv";
  }
  return "other";
}

function assertAllowedUpload(filename: string, size: number): void {
  if (size > MAX_BYTES) {
    throw new Error("File size must be less than 10MB");
  }
  const ext = extensionOf(filename);
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    throw new Error("Use PDF, image, or CSV.");
  }
}

function toApi(row: Doc<"uploadedFiles">) {
  return {
    id: row.externalId,
    storageId: row.storageId,
    filename: row.filename,
    contentType: row.contentType,
    size: row.size,
    uploadedAt: row.uploadedAt,
    source: row.source,
    kind: fileKind(row.filename, row.contentType),
    linkType: row.linkType ?? null,
    linkId: row.linkId ?? null,
    linkLabel: row.linkLabel ?? null,
  };
}

function matchesFilter(row: Doc<"uploadedFiles">, filter: FileFilter): boolean {
  const kind = fileKind(row.filename, row.contentType);
  const attached = Boolean(row.linkType && row.linkId);
  switch (filter) {
    case "all":
      return true;
    case "pdf":
      return kind === "pdf";
    case "images":
      return kind === "image";
    case "csv":
      return kind === "csv";
    case "attached":
      return attached;
    case "unattached":
      return !attached;
    default:
      return true;
  }
}

function readCustomerName(info: unknown): string {
  if (info && typeof info === "object" && "name" in info) {
    const name = (info as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return "Invoice";
}

async function getOwnedFile(
  ctx: QueryCtx | MutationCtx,
  userId: Doc<"users">["_id"],
  externalId: string,
): Promise<Doc<"uploadedFiles">> {
  const row = await ctx.db
    .query("uploadedFiles")
    .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
    .unique();
  if (!row || row.userId !== userId) {
    throw new Error("File not found");
  }
  return row;
}

async function resolveLinkLabel(
  ctx: QueryCtx | MutationCtx,
  userId: Doc<"users">["_id"],
  linkType: LinkType,
  linkId: string,
): Promise<string> {
  if (linkType === "transaction") {
    const row = await ctx.db
      .query("transactions")
      .withIndex("by_externalId", (q) => q.eq("externalId", linkId))
      .unique();
    if (!row || row.userId !== userId) {
      throw new Error("Transaction not found");
    }
    return row.description;
  }
  if (linkType === "invoice") {
    const row = await ctx.db
      .query("invoices")
      .withIndex("by_externalId", (q) => q.eq("externalId", linkId))
      .unique();
    if (!row || row.userId !== userId) {
      throw new Error("Invoice not found");
    }
    return row.invoiceNumber || readCustomerName(row.customerInfo);
  }
  const row = await ctx.db
    .query("expenses")
    .withIndex("by_externalId", (q) => q.eq("externalId", linkId))
    .unique();
  if (!row || row.userId !== userId) {
    throw new Error("Expense not found");
  }
  return row.vendor?.trim() || "Expense";
}

function hrefFor(linkType: LinkType, id: string): string {
  if (linkType === "transaction") return `/transactions/${id}`;
  if (linkType === "invoice") return `/invoices/${id}`;
  return `/expenses/${id}`;
}

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const saveFileMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
    size: v.number(),
    source: v.optional(sourceValidator),
    linkType: v.optional(linkTypeValidator),
    linkId: v.optional(v.string()),
  },
  returns: fileApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    assertAllowedUpload(args.filename, args.size);

    let linkType = args.linkType;
    let linkId = args.linkId;
    let linkLabel: string | undefined;
    if (linkType && linkId) {
      linkLabel = await resolveLinkLabel(ctx, user._id, linkType, linkId);
    } else {
      linkType = undefined;
      linkId = undefined;
    }

    const now = Date.now();
    const externalId = newExternalId();
    await ctx.db.insert("uploadedFiles", {
      externalId,
      userId: user._id,
      userExternalId: user.externalId,
      storageId: args.storageId,
      filename: args.filename.trim() || "untitled",
      contentType: args.contentType || "application/octet-stream",
      size: args.size,
      uploadedAt: now,
      uploadedBy: user._id,
      source: args.source ?? "documents",
      linkType,
      linkId,
      linkLabel,
    });
    const row = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .unique();
    if (!row) throw new Error("File not found");
    return toApi(row);
  },
});

export const listFiles = query({
  args: {
    filter: v.optional(filterValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(fileApi),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const filter = args.filter ?? "all";
    const limit = Math.min(Math.max(args.limit ?? LIBRARY_TAKE, 1), LIBRARY_TAKE);
    const rows = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_user_and_uploadedAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(LIBRARY_TAKE);
    return rows.filter((row) => matchesFilter(row, filter)).slice(0, limit).map(toApi);
  },
});

export const listRecentFiles = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(fileApi),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = Math.min(Math.max(args.limit ?? 10, 1), 20);
    const rows = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_user_and_uploadedAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
    return rows.map(toApi);
  },
});

export const listFilesForLink = query({
  args: {
    linkType: linkTypeValidator,
    linkId: v.string(),
  },
  returns: v.array(fileApi),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_link", (q) =>
        q.eq("linkType", args.linkType).eq("linkId", args.linkId),
      )
      .take(50);
    return rows.filter((row) => row.userId === user._id).map(toApi);
  },
});

export const getFile = query({
  args: { fileId: v.string() },
  returns: v.union(fileApi, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.fileId))
      .unique();
    if (!row || row.userId !== user._id) return null;
    return toApi(row);
  },
});

export const getFileUrl = query({
  args: { fileId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("uploadedFiles")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.fileId))
      .unique();
    if (!row || row.userId !== user._id) return null;
    return await ctx.storage.getUrl(row.storageId);
  },
});

export const attachFile = mutation({
  args: {
    fileId: v.string(),
    linkType: linkTypeValidator,
    linkId: v.string(),
  },
  returns: fileApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await getOwnedFile(ctx, user._id, args.fileId);
    const linkLabel = await resolveLinkLabel(
      ctx,
      user._id,
      args.linkType,
      args.linkId,
    );
    await ctx.db.patch(row._id, {
      linkType: args.linkType,
      linkId: args.linkId,
      linkLabel,
    });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("File not found");
    return toApi(updated);
  },
});

export const detachFile = mutation({
  args: { fileId: v.string() },
  returns: fileApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await getOwnedFile(ctx, user._id, args.fileId);
    await ctx.db.replace(row._id, {
      externalId: row.externalId,
      userId: row.userId,
      userExternalId: row.userExternalId,
      storageId: row.storageId,
      filename: row.filename,
      contentType: row.contentType,
      size: row.size,
      uploadedAt: row.uploadedAt,
      uploadedBy: row.uploadedBy,
      source: row.source,
    });
    const updated = await ctx.db.get(row._id);
    if (!updated) throw new Error("File not found");
    return toApi(updated);
  },
});

export const deleteFile = mutation({
  args: { fileId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await getOwnedFile(ctx, user._id, args.fileId);
    await ctx.storage.delete(row.storageId);
    await ctx.db.delete(row._id);
    return null;
  },
});

export const searchLinkTargets = query({
  args: {
    linkType: linkTypeValidator,
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(linkTargetApi),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = Math.min(Math.max(args.limit ?? 5, 1), 20);
    const needle = args.search?.trim().toLowerCase() ?? "";

    if (args.linkType === "transaction") {
      const rows = await ctx.db
        .query("transactions")
        .withIndex("by_user_and_date", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(SEARCH_SCAN);
      const matched = needle
        ? rows.filter((row) => row.description.toLowerCase().includes(needle))
        : rows;
      return matched.slice(0, limit).map((row) => ({
        id: row.externalId,
        label: row.description,
        amount: row.amount,
        date: row.transactionDate,
        href: hrefFor("transaction", row.externalId),
      }));
    }

    if (args.linkType === "invoice") {
      const rows = await ctx.db
        .query("invoices")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(SEARCH_SCAN);
      const matched = needle
        ? rows.filter((row) => {
            const customer = readCustomerName(row.customerInfo).toLowerCase();
            return (
              row.invoiceNumber.toLowerCase().includes(needle) ||
              customer.includes(needle)
            );
          })
        : rows;
      return matched.slice(0, limit).map((row) => ({
        id: row.externalId,
        label: `${row.invoiceNumber} — ${readCustomerName(row.customerInfo)}`,
        amount: row.totalAmount ?? row.amountDue ?? null,
        date: row.invoiceDate ?? null,
        href: hrefFor("invoice", row.externalId),
      }));
    }

    const rows = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(SEARCH_SCAN);
    const matched = needle
      ? rows.filter((row) => {
          const vendor = (row.vendor ?? "").toLowerCase();
          const notes = (row.notes ?? "").toLowerCase();
          return vendor.includes(needle) || notes.includes(needle);
        })
      : rows;
    return matched.slice(0, limit).map((row) => ({
      id: row.externalId,
      label: row.vendor?.trim() || "Expense",
      amount: row.amount,
      date: row.date,
      href: hrefFor("expense", row.externalId),
    }));
  },
});
