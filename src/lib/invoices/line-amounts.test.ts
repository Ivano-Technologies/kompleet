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

  it("1.5 x 33.33 twice: rows and Subtotal agree, half-up (50.00 + 50.00 = 100.00)", () => {
    const rows = [
      { quantity: 1.5, unit_price: 33.33, vat_rate: 0 },
      { quantity: 1.5, unit_price: 33.33, vat_rate: 0 },
    ];
    expect(rows.map(lineNetAmount)).toEqual([50, 50]);
    const totals = totalsFromLines(rows);
    expect(totals.subtotal).toBe(100);
    expect(sumRows(rows)).toBe(totals.subtotal);
    expect(totals.total_amount).toBe(100);
  });

  it("2.5 x 0.99 twice: 2.475 rounds up to 2.48, Subtotal 4.96", () => {
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
    const {
      VAT_RATE_RANGE,
      INVALID_QUANTITY,
      INVALID_UNIT_PRICE,
      ALREADY_ISSUED,
      ADD_ITEM_BEFORE_ISSUE,
      STATUS_VIA_UPDATE,
    } = await import("./line-amounts");
    expect(VAT_RATE_RANGE).toBe("VAT rate must be between 0% and 100%.");
    expect(INVALID_QUANTITY).toBe("Enter a number for quantity.");
    expect(INVALID_UNIT_PRICE).toBe("Enter a number for unit price.");
    expect(ALREADY_ISSUED).toBe("This invoice has already been issued.");
    expect(ADD_ITEM_BEFORE_ISSUE).toBe("Add at least one item before issuing this invoice.");
    expect(STATUS_VIA_UPDATE).toBe("This update can't change the invoice status.");
  });

  it("the full form shows the friendly discount copy", async () => {
    const { readFileSync } = await import("node:fs");
    const form = readFileSync("src/app/(dashboard)/invoices/new/page.tsx", "utf8");
    expect(form).toMatch(/discountTooBig\(item\)/);
    expect(form).toMatch(/DISCOUNT_TOO_BIG/);
    expect(form).toMatch(/VAT_RATE_RANGE/);
    expect(form).toMatch(/INVALID_QUANTITY/);
    expect(form).toMatch(/INVALID_UNIT_PRICE/);
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
    expect(displayTotals(invoice)).toEqual({ subtotal: 100, vat_amount: 0, total_amount: 100 });
    const api = invoiceWithNetLineAmounts(invoice);
    expect(api.subtotal).toBe(100);
    expect(api.total_amount).toBe(100);
    expect(api.amount_due).toBe(100);
    expect(displayTotals({ subtotal: 10, vat_amount: 1, total_amount: 11, line_items: [] })).toEqual({
      subtotal: 10,
      vat_amount: 1,
      total_amount: 11,
    });
  });
});

describe("IVA-185 half-up kobo rounding", () => {
  it("rounds x.xx5 ties up, even where the float sits just below the tie", async () => {
    const { halfUpUnits, roundMoney, toKobo } = await import("./line-amounts");
    expect((1.5 * 33.33).toFixed(2)).toBe("49.99"); // the float noise toFixed used to trip on
    expect(roundMoney(1.5 * 33.33)).toBe(50);
    expect(roundMoney(2.5 * 0.99)).toBe(2.48);
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(1.015)).toBe(1.02);
    expect(roundMoney(0.125)).toBe(0.13);
    expect(roundMoney(10.235)).toBe(10.24);
    expect(roundMoney(8.345)).toBe(8.35);
    expect(roundMoney(1.0049)).toBe(1);
    expect(roundMoney(0.004)).toBe(0);
    expect(roundMoney(0.005)).toBe(0.01);
    expect(roundMoney(-1.005)).toBe(-1.01);
    expect(toKobo(49.995)).toBe(5000);
    expect(halfUpUnits(37.5, 0)).toBe(38);
    expect(halfUpUnits(37.49, 0)).toBe(37);
  });

  it("handles zero and empty input", async () => {
    const { roundMoney, toKobo } = await import("./line-amounts");
    expect(roundMoney(0)).toBe(0);
    expect(toKobo(Number.NaN)).toBe(0);
    expect(lineNetAmount({ quantity: 0, unit_price: 33.33, vat_rate: 7.5 })).toBe(0);
    expect(lineNetAmount({ quantity: 3, unit_price: 0, vat_rate: 7.5 })).toBe(0);
    expect(totalsFromLines([])).toEqual({ subtotal: 0, vat_amount: 0, discount_amount: 0, total_amount: 0 });
  });

  it("stays exact for large values", async () => {
    const { roundMoney } = await import("./line-amounts");
    expect(roundMoney(123456789.005)).toBe(123456789.01);
    expect(roundMoney(999999999.995)).toBe(1000000000);
    const rows = [
      { quantity: 1000, unit_price: 9999999.99, vat_rate: 7.5 },
      { quantity: 3.5, unit_price: 1234567.89, vat_rate: 7.5 },
    ];
    expect(rows.map(lineNetAmount)).toEqual([9999999990, 4320987.62]); // 4320987.615 rounds up
    const totals = totalsFromLines(rows);
    expect(totals.subtotal).toBe(10004320977.62);
    // 7.5% of 1,000,432,097,762 kobo = 75,032,407,332.15 -> 75,032,407,332 kobo
    expect(totals.vat_amount).toBe(750324073.32);
    expect(totals.total_amount).toBe(10754645050.94);
  });

  it("VAT ties round up: 7.5% of 0.30 is 2.25 kobo -> 0.02, of 0.70 is 5.25 kobo -> 0.05, of 0.20 is 1.5 kobo -> 0.02", () => {
    expect(totalsFromLines([{ quantity: 1, unit_price: 0.3, vat_rate: 7.5 }]).vat_amount).toBe(0.02);
    expect(totalsFromLines([{ quantity: 1, unit_price: 0.7, vat_rate: 7.5 }]).vat_amount).toBe(0.05);
    expect(totalsFromLines([{ quantity: 1, unit_price: 0.2, vat_rate: 7.5 }]).vat_amount).toBe(0.02);
  });
});


describe("IVA-185 discount limit compares the shown line total in kobo", () => {
  it("allows a discount equal to the shown line total and refuses one kobo more", async () => {
    const { discountTooBig, lineDiscount } = await import("./line-amounts");
    const line = { quantity: 1.5, unit_price: 33.33, vat_rate: 7.5 }; // 49.995 shown as 50.00
    expect(lineNetAmount(line)).toBe(50);
    expect(discountTooBig({ ...line, discount: 50 })).toBe(false);
    expect(lineNetAmount({ ...line, discount: 50 })).toBe(0);
    expect(lineDiscount({ ...line, discount: 50 })).toBe(50);
    expect(discountTooBig({ ...line, discount: 50.01 })).toBe(true);
    expect(discountTooBig({ ...line, discount: 49.99 })).toBe(false);
    // Float noise on the discount itself does not trip it either.
    expect(discountTooBig({ quantity: 1, unit_price: 0.3, vat_rate: 0, discount: 0.1 + 0.2 })).toBe(false);
  });
});

describe("IVA-185 vatByRate", () => {
  it("gives one entry per non-zero rate that adds up to the invoice VAT", async () => {
    const { vatByRate } = await import("./line-amounts");
    const rows = [
      { quantity: 1, unit_price: 1000, vat_rate: 7.5, discount: 100 },
      { quantity: 1, unit_price: 333.33, vat_rate: 5 },
      { quantity: 1.5, unit_price: 33.33, vat_rate: 5 },
      { quantity: 2, unit_price: 100, vat_rate: 0 },
    ];
    const lines = vatByRate(rows);
    expect(lines).toEqual([
      { rate: 7.5, base: 900, vat: 67.5 },
      { rate: 5, base: 383.33, vat: 19.17 }, // 19.1665 half-up
    ]);
    const totals = totalsFromLines(rows);
    expect(Number(lines.reduce((s, l) => s + l.vat, 0).toFixed(2))).toBe(totals.vat_amount);
    expect(vatByRate([{ quantity: 1, unit_price: 10, vat_rate: 0 }])).toEqual([]);
  });
});

describe("IVA-185 VAT row label matches the invoice", () => {
  it("uses the invoice's rate format with no brackets", async () => {
    const { vatRowLabel, vatRateText } = await import("./line-amounts");
    expect(vatRateText(7.5)).toBe("7.5%");
    expect(vatRowLabel(7.5)).toBe("VAT 7.5%");
    expect(vatRowLabel(5)).toBe("VAT 5%");
  });
});

describe("IVA-191 vatSummaryRows and 2-decimal unit price", () => {
  it("hides a ₦0.00 VAT row and always labels the rate, single or mixed", async () => {
    const { vatSummaryRows } = await import("./line-amounts");
    expect(vatSummaryRows([{ quantity: 1, unit_price: 10, vat_rate: 0 }])).toEqual([]);
    expect(vatSummaryRows([{ quantity: 1, unit_price: 1000, vat_rate: 7.5 }])).toEqual([
      { label: "VAT 7.5%", vat: 75 },
    ]);
    expect(
      vatSummaryRows([
        { quantity: 1, unit_price: 1000, vat_rate: 7.5 },
        { quantity: 1, unit_price: 200, vat_rate: 5 },
      ]),
    ).toEqual([
      { label: "VAT 7.5%", vat: 75 },
      { label: "VAT 5%", vat: 10 },
    ]);
  });

  it("limits unit price to 2 decimals so the printed rate matches the line total", async () => {
    const { lineNetAmount, roundMoney, totalsFromLines } = await import("./line-amounts");
    expect(roundMoney(33.335)).toBe(33.34);
    expect(lineNetAmount({ quantity: 3, unit_price: 33.335, vat_rate: 0 })).toBe(100.02);
    expect(totalsFromLines([{ quantity: 3, unit_price: 33.335, vat_rate: 0 }]).subtotal).toBe(100.02);
  });
});

describe("IVA-190 / IVA-191 client-server parity", () => {
  it("client and server totals match for a mixed-rate invoice totalling NGN 997,750.00", async () => {
    const mixed = [
      { quantity: 1, unit_price: 850000, vat_rate: 7.5 },
      { quantity: 2, unit_price: 40000, vat_rate: 5 },
    ];
    const { totalsFromLines: clientTotals, vatSummaryRows } = await import("./line-amounts");
    const { totalsFromLines: serverTotals } = await import("../../../convex/lib/lineAmounts");
    const { priceInvoiceLines } = await import("../../../convex/lib/invoiceAmounts");

    expect(clientTotals(mixed)).toEqual(serverTotals(mixed));
    expect(clientTotals(mixed)).toMatchObject({
      subtotal: 930000,
      vat_amount: 67750,
      total_amount: 997750,
    });
    expect(priceInvoiceLines(mixed).totalAmount).toBe(997750);
    expect(vatSummaryRows(mixed)).toEqual([
      { label: "VAT 7.5%", vat: 63750 },
      { label: "VAT 5%", vat: 4000 },
    ]);
  });
});


