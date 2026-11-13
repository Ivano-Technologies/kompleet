/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  computeVatPosition,
  invoiceIssueDate,
  isVatComputation,
} from "./vatPosition";

const Q3 = { periodStart: "2026-07-01", periodEnd: "2026-09-30" };
const issuedAt = Date.parse("2026-08-10T09:00:00Z");

describe("computeVatPosition (IVA-321)", () => {
  it("adds stored invoice VAT and stored expense VAT for the period", () => {
    const position = computeVatPosition({
      ...Q3,
      invoices: [
        { status: "issued", invoiceDate: "2026-07-01", issuedAt, vatAmount: 7500 },
        { status: "paid", invoiceDate: "2026-09-30", issuedAt, vatAmount: 15000.5 },
      ],
      expenses: [
        { date: "2026-07-15", vatAmount: 3000 },
        { date: "2026-09-30", vatAmount: 1500.25 },
      ],
    });
    expect(position).toEqual({
      kind: "vat",
      period_start: "2026-07-01",
      period_end: "2026-09-30",
      output_vat: 22500.5,
      input_vat: 4500.25,
      net_vat: 18000.25,
      invoice_count: 2,
      expense_count: 2,
    });
  });

  it("counts an issued invoice whether or not it has been paid", () => {
    const unpaid = computeVatPosition({
      ...Q3,
      invoices: [{ status: "issued", invoiceDate: "2026-08-01", issuedAt, vatAmount: 100 }],
      expenses: [],
    });
    const paid = computeVatPosition({
      ...Q3,
      invoices: [{ status: "paid", invoiceDate: "2026-08-01", issuedAt, vatAmount: 100 }],
      expenses: [],
    });
    expect(unpaid.output_vat).toBe(100);
    expect(paid.output_vat).toBe(100);
  });

  it("excludes draft and cancelled invoices", () => {
    const position = computeVatPosition({
      ...Q3,
      invoices: [
        { status: "draft", invoiceDate: "2026-08-01", vatAmount: 900 },
        { status: "cancelled", invoiceDate: "2026-08-01", issuedAt, vatAmount: 800 },
        // Archived before it was ever issued: still a draft for VAT.
        { status: "archived", invoiceDate: "2026-08-01", vatAmount: 700 },
        { status: "issued", invoiceDate: "2026-08-01", issuedAt, vatAmount: 75 },
      ],
      expenses: [],
    });
    expect(position.output_vat).toBe(75);
    expect(position.invoice_count).toBe(1);
  });

  it("leaves out invoices and expenses dated outside the period", () => {
    const position = computeVatPosition({
      ...Q3,
      invoices: [
        { status: "issued", invoiceDate: "2026-06-30", issuedAt, vatAmount: 500 },
        { status: "issued", invoiceDate: "2026-10-01", issuedAt, vatAmount: 500 },
      ],
      expenses: [
        { date: "2026-06-30", vatAmount: 40 },
        { date: "2026-10-01", vatAmount: 40 },
      ],
    });
    expect(position.output_vat).toBe(0);
    expect(position.input_vat).toBe(0);
    expect(position.net_vat).toBe(0);
  });

  it("returns a negative net VAT when input VAT is higher", () => {
    const position = computeVatPosition({
      ...Q3,
      invoices: [{ status: "issued", invoiceDate: "2026-08-01", issuedAt, vatAmount: 100 }],
      expenses: [{ date: "2026-08-02", vatAmount: 250 }],
    });
    expect(position.net_vat).toBe(-150);
  });

  it("treats missing VAT as zero and never applies a rate to totals", () => {
    const position = computeVatPosition({
      ...Q3,
      invoices: [{ status: "issued", invoiceDate: "2026-08-01", issuedAt }],
      expenses: [{ date: "2026-08-02" }, { date: "2026-08-03", vatAmount: null }],
    });
    expect(position.output_vat).toBe(0);
    expect(position.input_vat).toBe(0);
    expect(position.invoice_count).toBe(1);
    expect(position.expense_count).toBe(2);
  });

  it("adds kobo exactly", () => {
    const position = computeVatPosition({
      ...Q3,
      invoices: [
        { status: "issued", invoiceDate: "2026-08-01", issuedAt, vatAmount: 0.1 },
        { status: "issued", invoiceDate: "2026-08-01", issuedAt, vatAmount: 0.2 },
      ],
      expenses: [],
    });
    expect(position.output_vat).toBe(0.3);
  });

  it("rejects a malformed or reversed period", () => {
    const empty = { invoices: [], expenses: [] };
    expect(() =>
      computeVatPosition({ ...empty, periodStart: "", periodEnd: "2026-09-30" }),
    ).toThrow(/YYYY-MM-DD/);
    expect(() =>
      computeVatPosition({
        ...empty,
        periodStart: "2026-10-01",
        periodEnd: "2026-09-30",
      }),
    ).toThrow(/must not be after/);
  });
});

describe("invoiceIssueDate", () => {
  it("uses the invoice date, then the Lagos day it was issued", () => {
    expect(
      invoiceIssueDate({ status: "issued", invoiceDate: "2026-08-01", issuedAt }),
    ).toBe("2026-08-01");
    // 23:30 UTC on 30 September is already 1 October in Lagos (UTC+1).
    expect(
      invoiceIssueDate({
        status: "issued",
        issuedAt: Date.parse("2026-09-30T23:30:00Z"),
      }),
    ).toBe("2026-10-01");
  });

  it("is null for an invoice that was never issued", () => {
    expect(invoiceIssueDate({ status: "draft", invoiceDate: "2026-08-01" })).toBeNull();
    expect(invoiceIssueDate({ status: "archived", invoiceDate: "2026-08-01" })).toBeNull();
    expect(
      invoiceIssueDate({ status: "cancelled", invoiceDate: "2026-08-01", issuedAt }),
    ).toBeNull();
  });
});

describe("isVatComputation", () => {
  it("tells VAT data from an income tax computation", () => {
    expect(isVatComputation({ kind: "vat", output_vat: 1 })).toBe(true);
    expect(isVatComputation({ incomeTax: 1, total_tax_liability: 1 })).toBe(false);
    expect(isVatComputation(null)).toBe(false);
  });
});
