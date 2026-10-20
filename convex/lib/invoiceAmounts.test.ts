import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { totalsFromLines } from "./lineAmounts";
import { priceInvoiceLines } from "./invoiceAmounts";

describe("IVA-190 priceInvoiceLines", () => {
  it("rebuilds net amounts and per-rate VAT and ignores client-sent figures", () => {
    const priced = priceInvoiceLines([
      {
        description: "Catering",
        quantity: 1,
        unit_price: 850000,
        vat_rate: 7.5,
        amount: 1,
      },
      {
        description: "Delivery",
        quantity: 2,
        unit_price: 25000,
        vat_rate: 0,
        amount: 999,
      },
    ]);
    expect((priced.lineItems as Array<{ amount: number }>).map((line) => line.amount)).toEqual([
      850000, 50000,
    ]);
    expect(priced.subtotal).toBe(900000);
    expect(priced.vatAmount).toBe(63750);
    expect(priced.totalAmount).toBe(963750);
    expect(priced).toMatchObject({
      subtotal: totalsFromLines([
        { quantity: 1, unit_price: 850000, vat_rate: 7.5 },
        { quantity: 2, unit_price: 25000, vat_rate: 0 },
      ]).subtotal,
    });
  });

  it("uses 2-decimal unit price rounding (1.5 x 33.33 -> 50.00 each)", () => {
    const priced = priceInvoiceLines([
      { quantity: 1.5, unit_price: 33.33, vat_rate: 0, amount: 49.99 },
      { quantity: 1.5, unit_price: 33.33, vat_rate: 0, amount: 49.99 },
    ]);
    expect((priced.lineItems as Array<{ amount: number }>).map((line) => line.amount)).toEqual([
      50, 50,
    ]);
    expect(priced.subtotal).toBe(100);
    expect(priced.totalAmount).toBe(100);
  });

  it("throws ConvexError for negative quantity, negative rate, and a discount that is too big", () => {
    expect(() =>
      priceInvoiceLines([{ quantity: -1, unit_price: 10, vat_rate: 0 }]),
    ).toThrow(ConvexError);
    expect(() =>
      priceInvoiceLines([{ quantity: 1, unit_price: -10, vat_rate: 0 }]),
    ).toThrow(ConvexError);
    expect(() =>
      priceInvoiceLines([{ quantity: 1, unit_price: 10, vat_rate: 0, discount: 10.01 }]),
    ).toThrow(ConvexError);
  });

  it("rejects VAT rates outside 0 to 100 inclusive", () => {
    expect(() =>
      priceInvoiceLines([{ quantity: 1, unit_price: 10, vat_rate: -100 }]),
    ).toThrow(ConvexError);
    expect(() =>
      priceInvoiceLines([{ quantity: 1, unit_price: 10, vat_rate: 500 }]),
    ).toThrow(ConvexError);
    expect(
      priceInvoiceLines([{ quantity: 1, unit_price: 10, vat_rate: 0 }]).hasLines,
    ).toBe(true);
    expect(
      priceInvoiceLines([{ quantity: 1, unit_price: 10, vat_rate: 100 }]).totalAmount,
    ).toBe(20);
  });

  it("rejects a quantity or unit price that is not a finite number", () => {
    expect(() =>
      priceInvoiceLines([{ quantity: Number.NaN, unit_price: 10, vat_rate: 0 }]),
    ).toThrow(ConvexError);
    expect(() =>
      priceInvoiceLines([{ quantity: "2", unit_price: 10, vat_rate: 0 }]),
    ).toThrow(ConvexError);
    expect(() =>
      priceInvoiceLines([{ quantity: 1, unit_price: null, vat_rate: 0 }]),
    ).toThrow(ConvexError);
    expect(() =>
      priceInvoiceLines([{ quantity: 1, unit_price: Number.POSITIVE_INFINITY, vat_rate: 0 }]),
    ).toThrow(ConvexError);
  });

  it("does not treat missing or empty lines as zero totals for callers", () => {
    expect(priceInvoiceLines(undefined).hasLines).toBe(false);
    expect(priceInvoiceLines([]).hasLines).toBe(false);
    expect(priceInvoiceLines(null).hasLines).toBe(false);
  });

  it("stores unit price rounded to 2 decimals", () => {
    const priced = priceInvoiceLines([{ quantity: 3, unit_price: 33.335, vat_rate: 0 }]);
    expect((priced.lineItems as Array<{ unit_price: number; amount: number }>)[0]).toMatchObject({
      unit_price: 33.34,
      amount: 100.02,
    });
    expect(priced.subtotal).toBe(100.02);
  });

  it("strips client-sent amount fields and keeps the server net", () => {
    const priced = priceInvoiceLines([
      {
        description: "A",
        quantity: 2,
        unit_price: 50,
        vat_rate: 0,
        amount: 1,
        lineTotal: 9,
        vatAmount: 8,
        subtotal: 7,
        total: 6,
      },
    ]);
    const line = (priced.lineItems as Array<Record<string, unknown>>)[0]!;
    expect(line.amount).toBe(100);
    expect(line).not.toHaveProperty("lineTotal");
    expect(line).not.toHaveProperty("vatAmount");
    expect(line).not.toHaveProperty("subtotal");
    expect(line).not.toHaveProperty("total");
  });
});
