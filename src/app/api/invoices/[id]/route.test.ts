/** @vitest-environment node */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAuthedConvex = vi.fn();

vi.mock("@/lib/convex/server", () => ({
  requireAuthedConvex: (...args: unknown[]) => requireAuthedConvex(...args),
  isUnauthorized: () => false,
}));

vi.mock("@/lib/convex/http", () => ({
  api: { invoices: { getMine: "invoices.getMine", listMine: "invoices.listMine" } },
}));

vi.mock("@/lib/with-audit", () => ({
  withAudit: (handler: unknown) => handler,
}));

import { GET } from "./route";
import { GET as LIST } from "../route";

// A full-form invoice saved before IVA-185 stored the amount including VAT.
const legacy = {
  id: "inv1",
  subtotal: 900000,
  vat_amount: 63750,
  total_amount: 963750,
  line_items: [
    { description: "Catering", quantity: 1, unit_price: 850000, vat_rate: 7.5, amount: 913750 },
    { description: "Delivery", quantity: 2, unit_price: 25000, vat_rate: 0, amount: 50000 },
  ],
};

type Line = { amount: number };

describe("IVA-185 invoice API line amounts", () => {
  beforeEach(() => requireAuthedConvex.mockReset());

  it("GET /api/invoices/[id] returns pre-VAT line amounts that sum to the subtotal", async () => {
    requireAuthedConvex.mockResolvedValue({ convex: { query: vi.fn().mockResolvedValue(legacy) } });
    const res = await GET(new Request("http://localhost/api/invoices/inv1") as never, {
      params: Promise.resolve({ id: "inv1" }),
    });
    const body = (await res.json()) as { invoice: typeof legacy };
    const amounts = body.invoice.line_items.map((line: Line) => line.amount);
    expect(amounts).toEqual([850000, 50000]);
    expect(amounts.reduce((a: number, b: number) => a + b, 0)).toBe(body.invoice.subtotal);
    expect(body.invoice.subtotal + body.invoice.vat_amount).toBe(body.invoice.total_amount);
  });

  it("GET /api/invoices returns pre-VAT line amounts", async () => {
    requireAuthedConvex.mockResolvedValue({ convex: { query: vi.fn().mockResolvedValue([legacy]) } });
    const res = await LIST(new NextRequest("http://localhost/api/invoices"));
    const body = (await res.json()) as { invoices: Array<typeof legacy> };
    expect(body.invoices[0]!.line_items.map((line: Line) => line.amount)).toEqual([850000, 50000]);
  });
});
