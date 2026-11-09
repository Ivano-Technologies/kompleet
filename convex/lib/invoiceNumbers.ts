import { ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
  DUPLICATE_INVOICE_NUMBER,
  EMPTY_INVOICE_NUMBER,
  INVALID_INVOICE_NUMBER,
} from "./lineAmounts";

/** Letters, digits, then hyphens, dots, underscores or slashes. Max 64 chars. */
const IRN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/;
const IRN_MAX_LENGTH = 64;

export function formatInvoiceNumber(taxYear: number, n: number): string {
  return `INV-${taxYear}-${String(n).padStart(4, "0")}`;
}

export async function findInvoicesByNumber(
  ctx: MutationCtx,
  userId: Id<"users">,
  invoiceNumber: string,
): Promise<Doc<"invoices">[]> {
  const needle = invoiceNumber.trim().toLowerCase();
  const rows = await ctx.db
    .query("invoices")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return rows.filter((row) => row.invoiceNumber.toLowerCase() === needle);
}

/**
 * Reject a caller-supplied number that another of this seller's invoices
 * already uses. The index read plus later insert is occupancy-safe: Convex
 * retries the mutation if a concurrent insert lands in the same range.
 */
export async function assertInvoiceNumberAvailable(
  ctx: MutationCtx,
  userId: Id<"users">,
  invoiceNumber: string,
  exceptInvoiceId?: Id<"invoices">,
): Promise<string> {
  const trimmed = invoiceNumber.trim();
  if (!trimmed) {
    throw new ConvexError(EMPTY_INVOICE_NUMBER);
  }
  if (trimmed.length > IRN_MAX_LENGTH || !IRN_PATTERN.test(trimmed)) {
    throw new ConvexError(INVALID_INVOICE_NUMBER);
  }
  const matches = await findInvoicesByNumber(ctx, userId, trimmed);
  if (matches.some((row) => row._id !== exceptInvoiceId)) {
    throw new ConvexError(DUPLICATE_INVOICE_NUMBER);
  }
  return trimmed;
}

/**
 * Next invoice number for this owner and tax year.
 *
 * Always reads and patches the same user+year sequence row so concurrent
 * nextNumber / create calls conflict and retry (Convex OCC). Skips numbers
 * this seller already has, including caller-supplied ones.
 */
export async function allocateNextInvoiceNumber(
  ctx: MutationCtx,
  userId: Id<"users">,
  taxYear: number,
): Promise<string> {
  const rows = await ctx.db
    .query("invoiceSequences")
    .withIndex("by_user_and_year", (q) =>
      q.eq("userId", userId).eq("taxYear", taxYear),
    )
    .collect();
  const existing = rows[0];
  let next = existing?.nextNumber ?? 1;
  let sequenceId = existing?._id;

  if (existing) {
    await ctx.db.patch(existing._id, { nextNumber: next });
  } else {
    sequenceId = await ctx.db.insert("invoiceSequences", {
      userId,
      taxYear,
      nextNumber: next,
    });
  }

  for (;;) {
    const candidate = formatInvoiceNumber(taxYear, next);
    const taken = await findInvoicesByNumber(ctx, userId, candidate);
    if (taken.length === 0) {
      await ctx.db.patch(sequenceId, { nextNumber: next + 1 });
      return candidate;
    }
    next += 1;
  }
}
