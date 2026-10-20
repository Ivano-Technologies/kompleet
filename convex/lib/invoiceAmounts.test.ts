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
});
