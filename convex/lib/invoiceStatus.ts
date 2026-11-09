import { ConvexError } from "convex/values";
import {
  ALREADY_CANCELLED,
  ALREADY_PAID,
  INVOICE_LOCKED,
  INVALID_PAID_ON,
  ONLY_ISSUED_CAN_BE_CANCELLED,
  ONLY_ISSUED_CAN_BE_PAID,
} from "./lineAmounts";

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "paid"
  | "cancelled"
  | "archived";

function isInvoiceStatus(status: string): status is InvoiceStatus {
  switch (status) {
    case "draft":
    case "issued":
    case "paid":
    case "cancelled":
    case "archived":
      return true;
    default:
      return false;
  }
}

export function isTerminalStatus(status: string): boolean {
  if (!isInvoiceStatus(status)) return false;
  switch (status) {
    case "paid":
    case "cancelled":
    case "archived":
      return true;
    case "draft":
    case "issued":
      return false;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function isLockedInvoice(row: {
  status: string;
  isImmutable: boolean;
}): boolean {
  return row.isImmutable || isTerminalStatus(row.status);
}

export function assertNotLocked(row: {
  status: string;
  isImmutable: boolean;
}): void {
  if (isLockedInvoice(row)) {
    throw new ConvexError(INVOICE_LOCKED);
  }
}

export function assertCanMarkPaid(row: { status: string }): void {
  if (!isInvoiceStatus(row.status)) {
    throw new ConvexError(ONLY_ISSUED_CAN_BE_PAID);
  }
  switch (row.status) {
    case "issued":
      return;
    case "paid":
      throw new ConvexError(ALREADY_PAID);
    case "cancelled":
      throw new ConvexError(ALREADY_CANCELLED);
    case "draft":
    case "archived":
      throw new ConvexError(ONLY_ISSUED_CAN_BE_PAID);
    default: {
      const _exhaustive: never = row.status;
      throw new ConvexError(_exhaustive);
    }
  }
}

export function assertCanCancel(row: { status: string }): void {
  if (!isInvoiceStatus(row.status)) {
    throw new ConvexError(ONLY_ISSUED_CAN_BE_CANCELLED);
  }
  switch (row.status) {
    case "issued":
      return;
    case "paid":
      throw new ConvexError(ALREADY_PAID);
    case "cancelled":
      throw new ConvexError(ALREADY_CANCELLED);
    case "draft":
    case "archived":
      throw new ConvexError(ONLY_ISSUED_CAN_BE_CANCELLED);
    default: {
      const _exhaustive: never = row.status;
      throw new ConvexError(_exhaustive);
    }
  }
}

const PAID_ON_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function resolvePaidOn(paidOn?: string): {
  paidAt: number;
  paidOn: string;
} {
  if (!paidOn || !paidOn.trim()) {
    const now = Date.now();
    return { paidAt: now, paidOn: new Date(now).toISOString().slice(0, 10) };
  }
  const trimmed = paidOn.trim();
  if (!PAID_ON_PATTERN.test(trimmed)) {
    throw new ConvexError(INVALID_PAID_ON);
  }
  const paidAt = Date.parse(`${trimmed}T00:00:00.000Z`);
  if (!Number.isFinite(paidAt)) {
    throw new ConvexError(INVALID_PAID_ON);
  }
  return { paidAt, paidOn: trimmed };
}
