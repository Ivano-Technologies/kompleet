import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  ALREADY_PAID,
  INVOICE_LOCKED,
  INVALID_PAID_ON,
  ONLY_ISSUED_CAN_BE_PAID,
} from "./lineAmounts";
import {
  assertCanMarkPaid,
  assertNotLocked,
  isTerminalStatus,
  resolvePaidOn,
} from "./invoiceStatus";

describe("invoiceStatus", () => {
  it("treats paid, cancelled and archived as terminal", () => {
    expect(isTerminalStatus("paid")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
    expect(isTerminalStatus("archived")).toBe(true);
    expect(isTerminalStatus("issued")).toBe(false);
    expect(isTerminalStatus("draft")).toBe(false);
  });

  it("locks paid invoices against edits", () => {
    expect(() =>
      assertNotLocked({ status: "paid", isImmutable: true }),
    ).toThrow(ConvexError);
    try {
      assertNotLocked({ status: "paid", isImmutable: true });
    } catch (err) {
      expect(err).toMatchObject({ name: "ConvexError", data: INVOICE_LOCKED });
    }
  });

  it("only issued invoices can be marked paid", () => {
    expect(() => assertCanMarkPaid({ status: "issued" })).not.toThrow();
    try {
      assertCanMarkPaid({ status: "draft" });
    } catch (err) {
      expect(err).toMatchObject({
        name: "ConvexError",
        data: ONLY_ISSUED_CAN_BE_PAID,
      });
    }
    try {
      assertCanMarkPaid({ status: "paid" });
    } catch (err) {
      expect(err).toMatchObject({ name: "ConvexError", data: ALREADY_PAID });
    }
  });

  it("parses a paidOn date or defaults to today", () => {
    expect(resolvePaidOn("2026-11-08")).toEqual({
      paidAt: Date.parse("2026-11-08T00:00:00.000Z"),
      paidOn: "2026-11-08",
    });
    const fallback = resolvePaidOn();
    expect(fallback.paidOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(() => resolvePaidOn("11-08-2026")).toThrow(ConvexError);
    try {
      resolvePaidOn("not-a-date");
    } catch (err) {
      expect(err).toMatchObject({ name: "ConvexError", data: INVALID_PAID_ON });
    }
  });
});
