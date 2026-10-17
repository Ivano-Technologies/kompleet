import { describe, expect, it } from "vitest";
import { lineNetAmount, totalsFromLines } from "./line-amounts";
import { calculateInvoiceTotals, calculateLineItemAmount } from "@/lib/invoice-service";

// Coco's review case: catering at 850,000 with 7.5% VAT plus 2 x 25,000 at 0%.
const items = [
  { description: "Event catering", quantity: 1, unit_price: 850000, vat_rate: 7.5, amount: 913750 },
  { description: "Delivery and setup", quantity: 2, unit_price: 25000, vat_rate: 0, amount: 50000 },
  { description: "Discounted extra", quantity: 3, unit_price: 1000.5, vat_rate: 7.5, discount: 500, amount: 0 },
];

describe("IVA-185 line amounts", () => {
  it("a line amount is pre-VAT: quantity x rate minus discount", () => {
    expect(lineNetAmount(items[0]!)).toBe(850000);
    expect(lineNetAmount(items[1]!)).toBe(50000);
    expect(lineNetAmount(items[2]!)).toBe(2501.5);
  });

  it("invoice-service line amount is the same pre-VAT net (was VAT inclusive)", () => {
    expect(calculateLineItemAmount(items[0]!)).toBe(850000);
  });

  it("line amounts sum to the subtotal and subtotal + VAT equals the total", () => {
    const totals = calculateInvoiceTotals(items);
    const sum = Number(items.reduce((acc, item) => acc + lineNetAmount(item), 0).toFixed(2));
    expect(sum).toBe(totals.subtotal);
    expect(totals.subtotal).toBe(902501.5);
    expect(Number((totals.subtotal + totals.vat_amount).toFixed(2))).toBe(totals.total_amount);
    expect(totals).toEqual(totalsFromLines(items));
  });

  it("matches the review numbers: subtotal 900,000, VAT 63,750, total 963,750", () => {
    const totals = calculateInvoiceTotals(items.slice(0, 2));
    expect(totals).toMatchObject({ subtotal: 900000, vat_amount: 63750, total_amount: 963750 });
  });
});
