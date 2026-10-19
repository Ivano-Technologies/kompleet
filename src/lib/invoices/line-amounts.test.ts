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

describe("IVA-185 withNetLineAmounts", () => {
  it("rewrites stored VAT inclusive amounts to the net and keeps other fields", async () => {
    const { withNetLineAmounts, invoiceWithNetLineAmounts } = await import("./line-amounts");
    const out = withNetLineAmounts(items);
    expect(out.map((item) => item.amount)).toEqual([850000, 50000, 2501.5]);
    expect(out[0]!.description).toBe("Event catering");
    expect(withNetLineAmounts(null)).toBeNull();
    expect(invoiceWithNetLineAmounts({ id: "x", line_items: null }).line_items).toBeNull();
  });
});

describe("IVA-185 subtotal is the sum of rounded line amounts", () => {
  const sumRows = (rows: Array<{ quantity: number; unit_price: number; vat_rate: number }>) =>
    Number(rows.reduce((acc, row) => acc + lineNetAmount(row), 0).toFixed(2));

  it("1.5 x 33.33 twice: rows and Subtotal agree (99.98)", () => {
    const rows = [
      { quantity: 1.5, unit_price: 33.33, vat_rate: 0 },
      { quantity: 1.5, unit_price: 33.33, vat_rate: 0 },
    ];
    expect(rows.map(lineNetAmount)).toEqual([49.99, 49.99]);
    const totals = totalsFromLines(rows);
    expect(totals.subtotal).toBe(99.98);
    expect(sumRows(rows)).toBe(totals.subtotal);
    expect(totals.total_amount).toBe(99.98);
  });

  it("2.5 x 0.99 twice: rows and Subtotal agree (4.96)", () => {
    const rows = [
      { quantity: 2.5, unit_price: 0.99, vat_rate: 7.5 },
      { quantity: 2.5, unit_price: 0.99, vat_rate: 7.5 },
    ];
    expect(rows.map(lineNetAmount)).toEqual([2.48, 2.48]);
    const totals = totalsFromLines(rows);
    expect(totals.subtotal).toBe(4.96);
    expect(sumRows(rows)).toBe(totals.subtotal);
    // VAT on the Subtotal: 4.96 x 7.5% = 0.372 -> 0.37
    expect(totals.vat_amount).toBe(0.37);
    expect(totals.total_amount).toBe(5.33);
    expect(Number((totals.subtotal + totals.vat_amount).toFixed(2))).toBe(totals.total_amount);
  });

  it("VAT is computed on the Subtotal, not summed per line", () => {
    // Three lines of 0.10 at 7.5%: per line VAT would round 0.0075 each to 0.01 (0.03 total).
    const rows = Array.from({ length: 3 }, () => ({ quantity: 1, unit_price: 0.1, vat_rate: 7.5 }));
    const totals = totalsFromLines(rows);
    expect(totals.subtotal).toBe(0.3);
    expect(totals.vat_amount).toBe(0.02);
    expect(totals.total_amount).toBe(0.32);
  });
});

describe("IVA-185 line discount clamp", () => {
  it("clamps the discount to 0..(quantity x rate)", async () => {
    const { lineDiscount, discountTooBig, hasLineDiscount, DISCOUNT_TOO_BIG } = await import("./line-amounts");
    const line = { quantity: 2, unit_price: 100, vat_rate: 0 };
    expect(lineDiscount({ ...line, discount: 50 })).toBe(50);
    expect(lineDiscount({ ...line, discount: 500 })).toBe(200);
    expect(lineDiscount({ ...line, discount: -10 })).toBe(0);
    expect(lineNetAmount({ ...line, discount: 500 })).toBe(0);
    expect(lineNetAmount({ ...line, discount: -10 })).toBe(200);
    expect(discountTooBig({ ...line, discount: 201 })).toBe(true);
    expect(discountTooBig({ ...line, discount: 200 })).toBe(false);
    expect(hasLineDiscount([line, { ...line, discount: 0 }])).toBe(false);
    expect(hasLineDiscount([line, { ...line, discount: 1 }])).toBe(true);
    expect(DISCOUNT_TOO_BIG).toBe("Discount can't be more than the line total.");
  });

  it("the full form shows the friendly discount copy", async () => {
    const { readFileSync } = await import("node:fs");
    const form = readFileSync("src/app/(dashboard)/invoices/new/page.tsx", "utf8");
    expect(form).toMatch(/discountTooBig\(item\)/);
    expect(form).toMatch(/DISCOUNT_TOO_BIG/);
    expect(form).toMatch(/totalsFromLines\(lineItems\)/);
  });
});

describe("IVA-185 displayTotals and API totals", () => {
  it("rebuilds subtotal, VAT and total from the lines, ignoring stale stored totals", async () => {
    const { displayTotals, invoiceWithNetLineAmounts } = await import("./line-amounts");
    const invoice = {
      subtotal: 99.99,
      vat_amount: 0,
      total_amount: 99.99,
      amount_due: 99.99,
      line_items: [
        { quantity: 1.5, unit_price: 33.33, vat_rate: 0, amount: 49.995 },
        { quantity: 1.5, unit_price: 33.33, vat_rate: 0, amount: 49.995 },
      ],
    };
    expect(displayTotals(invoice)).toEqual({ subtotal: 99.98, vat_amount: 0, total_amount: 99.98 });
    const api = invoiceWithNetLineAmounts(invoice);
    expect(api.subtotal).toBe(99.98);
    expect(api.total_amount).toBe(99.98);
    expect(api.amount_due).toBe(99.98);
    expect(displayTotals({ subtotal: 10, vat_amount: 1, total_amount: 11, line_items: [] })).toEqual({
      subtotal: 10,
      vat_amount: 1,
      total_amount: 11,
    });
  });
});
