/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireAuthedConvex, loadRuleBundle, computeTax } = vi.hoisted(() => ({
  requireAuthedConvex: vi.fn(),
  loadRuleBundle: vi.fn(),
  computeTax: vi.fn(),
}));

vi.mock("@/lib/convex/server", () => ({
  requireAuthedConvex: (request: Request) => requireAuthedConvex(request),
  isUnauthorized: (error: unknown) =>
    error instanceof Error && error.message === "Unauthorized",
}));

vi.mock("@/lib/convex/http", () => ({
  api: {
    tax: {
      saveReport: "tax.saveReport",
      generateVatReport: "tax.generateVatReport",
    },
  },
}));

vi.mock("@/lib/tax/rule-loader", () => ({
  loadRuleBundle: (...args: unknown[]) => loadRuleBundle(...args),
}));

vi.mock("@/lib/services/tax-computation-service", () => ({
  TaxComputationService: {
    computeTax: (...args: unknown[]) => computeTax(...args),
  },
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: <T,>(handler: T) => handler,
}));

import { POST } from "./route";

function post(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/tax-reports/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const PERIOD = {
  taxYear: 2026,
  periodStart: "2026-07-01",
  periodEnd: "2026-09-30",
};

describe("POST /api/tax-reports/generate (IVA-321)", () => {
  const mutation = vi.fn();

  beforeEach(() => {
    mutation.mockReset();
    requireAuthedConvex.mockReset();
    loadRuleBundle.mockReset();
    computeTax.mockReset();
    requireAuthedConvex.mockResolvedValue({ convex: { mutation } });
  });

  it("generates a VAT report from the VAT computation, not the income tax one", async () => {
    mutation.mockResolvedValue({ id: "rep-vat", report_type: "vat", net_vat: 18000.25 });

    const res = await POST(
      post({
        ...PERIOD,
        reportType: "vat",
        businessType: "other_company",
        // Book totals sent by the Generate from books card must be ignored.
        turnover: 10_000_000,
        totalRevenue: 10_000_000,
        totalExpenses: 4_000_000,
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      report: { id: "rep-vat", report_type: "vat", net_vat: 18000.25 },
    });
    expect(mutation).toHaveBeenCalledTimes(1);
    expect(mutation).toHaveBeenCalledWith("tax.generateVatReport", PERIOD);
    expect(computeTax).not.toHaveBeenCalled();
    expect(loadRuleBundle).not.toHaveBeenCalled();
  });

  it("rejects a VAT period that ends before it starts", async () => {
    const res = await POST(
      post({
        reportType: "vat",
        taxYear: 2026,
        periodStart: "2026-09-30",
        periodEnd: "2026-07-01",
      }),
    );
    expect(res.status).toBe(400);
    expect(mutation).not.toHaveBeenCalled();
  });

  it("still runs the income tax computation for an income tax report", async () => {
    loadRuleBundle.mockResolvedValue({ rules: [] });
    computeTax.mockReturnValue({
      businessClassification: "Other Company",
      qualifiesAsSmallCompany: false,
      grossIncome: 10_000_000,
      assessableProfit: 6_000_000,
      taxableIncome: 6_000_000,
      incomeTax: 1_800_000,
      developmentLevy: 240_000,
      totalTaxLiability: 2_040_000,
      effectiveTaxRate: 20.4,
    });
    mutation.mockResolvedValue({ id: "rep-cit", report_type: "income_tax" });

    const res = await POST(
      post({
        ...PERIOD,
        reportType: "income_tax",
        businessType: "other_company",
        turnover: 10_000_000,
        totalRevenue: 10_000_000,
        totalExpenses: 4_000_000,
      }),
    );

    expect(res.status).toBe(200);
    expect(computeTax).toHaveBeenCalledTimes(1);
    expect(mutation).toHaveBeenCalledTimes(1);
    const [fn, args] = mutation.mock.calls[0];
    expect(fn).toBe("tax.saveReport");
    expect(args).toMatchObject({
      reportType: "income_tax",
      taxYear: 2026,
      computationData: {
        income_tax: 1_800_000,
        total_tax_liability: 2_040_000,
        period_start: "2026-07-01",
        period_end: "2026-09-30",
        status: "draft",
      },
    });
    expect(args.computationData.kind).toBeUndefined();
  });

  it("returns 401 without a session", async () => {
    requireAuthedConvex.mockRejectedValue(new Error("Unauthorized"));
    const res = await POST(post({ ...PERIOD, reportType: "vat" }));
    expect(res.status).toBe(401);
  });
});
