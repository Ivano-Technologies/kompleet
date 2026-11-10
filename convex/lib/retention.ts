/**
 * Data retention windows for NDPC-oriented purge.
 *
 * Self-service erasure already runs in eraseMineHandler (files, auth, drafts).
 * Issued invoices stay anonymised for six years. This module only decides
 * *when* leftover auth rows and anonymised records may be deleted.
 */

import { ISSUED_INVOICE_RETENTION_YEARS } from "./eraseAccount";

const DAY_MS = 24 * 60 * 60 * 1000;
const YEAR_MS = 365.25 * DAY_MS;

/** Expired OTPs / magic-link codes are deleted this long after expirationTime. */
export const OTP_PURGE_GRACE_MS = DAY_MS;

/** Expired Convex Auth sessions and refresh tokens are deleted once expiry has passed. */
export const SESSION_PURGE_GRACE_MS = 0;

/**
 * Soft-deleted user rows (anonymised email) are held this long after deletedAt
 * so the account_erased audit row remains, then removed if no invoices remain.
 */
export const SOFT_DELETED_USER_HOLD_MS = 30 * DAY_MS;

export const ISSUED_INVOICE_RETENTION_MS =
  ISSUED_INVOICE_RETENTION_YEARS * YEAR_MS;

export const RETENTION_BATCH = 100;

export const RETENTION_POLICY = {
  otps: "Auth verification codes are deleted 24 hours after they expire.",
  sessions:
    "Auth sessions and refresh tokens are deleted once expirationTime has passed.",
  accountDeletion:
    "Settings → Delete account erases profile, files (including Convex _storage), drafts and activity immediately.",
  invoices:
    "Issued invoices are anonymised on account deletion and kept for six years as tax records, then purged.",
  userRow:
    "The anonymised users row is removed 30 days after deletion once no retained invoices remain.",
} as const;

export function isPastExpiry(
  expirationTime: number,
  now: number,
  graceMs = 0,
): boolean {
  return expirationTime + graceMs < now;
}

export function invoiceRetentionEndsAt(invoice: {
  issuedAt?: number;
  createdAt: number;
}): number {
  return (invoice.issuedAt ?? invoice.createdAt) + ISSUED_INVOICE_RETENTION_MS;
}

export function shouldPurgeInvoice(
  invoice: { issuedAt?: number; createdAt: number },
  now: number,
): boolean {
  return invoiceRetentionEndsAt(invoice) <= now;
}

export function shouldPurgeDeletedUser(
  user: { deletedAt?: number },
  remainingInvoices: number,
  now: number,
): boolean {
  if (!user.deletedAt) return false;
  if (remainingInvoices > 0) return false;
  return user.deletedAt + SOFT_DELETED_USER_HOLD_MS <= now;
}
