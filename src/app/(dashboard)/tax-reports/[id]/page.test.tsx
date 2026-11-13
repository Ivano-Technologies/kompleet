/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import TaxReportDetailPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: "rep-1" }),
}));

vi.mock("@/components/ui/error-toast", () => ({
  notifyError: vi.fn(),
}));

/** Text that only the income tax (CIT) computation renders. */
const CIT_ONLY_TEXT = [
  "Tax Computation Summary",
  "Business Classification",
  "Small Company Status",
  "Assessable Profit",
  "Taxable Income",
  "Income Tax",
  "Total Tax Liability",
  "Effective Tax Rate",
  "Development Levy (4%)",
  "Detailed Breakdown",
];

const BASE = {
  id: "rep-1",
  tax_year: 2026,
  period_start: "2026-07-01",
  period_end: "2026-09-30",
  status: "draft",
  created_at: "2026-10-02T08:00:00.000Z",
};

/** Q3 2026: output 22,500.50, input 4,500.25, net 18,000.25. */
const VAT_DATA = {
  kind: "vat",
  period_start: "2026-07-01",
  period_end: "2026-09-30",
  output_vat: 22500.5,
  input_vat: 4500.25,
  net_vat: 18000.25,
  invoice_count: 2,
  expense_count: 1,
  status: "draft",
};

const CIT_DATA = {
  businessClassification: "Other Company",
  deductibleExpenses: 4_000_000,
  taxBreakdown: [{ description: "Company income tax", rate: 30, amount: 1_800_000 }],
  business_classification: "Other Company",
  qualifies_as_small_company: false,
  total_revenue: 10_000_000,
  total_expenses: 4_000_000,
  assessable_profit: 6_000_000,
  taxable_income: 6_000_000,
  income_tax: 1_800_000,
  development_levy: 240_000,
  total_tax_liability: 2_040_000,
  effective_tax_rate: 20.4,
  status: "draft",
};

const vatReport = { ...BASE, ...VAT_DATA, report_type: "vat", computation_data: VAT_DATA };
const legacyVatReport = {
  ...BASE,
  ...CIT_DATA,
  report_type: "vat",
  computation_data: CIT_DATA,
};
const citReport = {
  ...BASE,
  ...CIT_DATA,
  report_type: "income_tax",
  computation_data: CIT_DATA,
};

function respond(report: unknown): Response {
  return { ok: true, json: async () => ({ report }) } as Response;
}

function expectNoCitComputation() {
  for (const text of CIT_ONLY_TEXT) {
    expect(screen.queryByText(text), text).toBeNull();
  }
  // No income tax amounts from the stored computation either.
  expect(document.body.textContent).not.toMatch(/2,040,000|1,800,000|6,000,000/);
}

describe("TaxReportDetailPage (IVA-321)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows output, input and net VAT for a VAT report, and no CIT computation", async () => {
    vi.mocked(fetch).mockResolvedValue(respond(vatReport));

    render(<TaxReportDetailPage />);

    await screen.findByText("VAT Summary");
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe("/api/tax-reports/rep-1");
    expect(screen.getByRole("heading", { level: 1, name: "VAT Report 2026" })).toBeTruthy();
    // The report's own period (shown in the page header and the print header).
    expect(
      screen.getAllByText(/1 July 2026 to\s+30 September 2026/).length,
    ).toBeGreaterThan(0);

    expect(screen.getByText("Output VAT")).toBeTruthy();
    expect(screen.getByText("Input VAT")).toBeTruthy();
    expect(screen.getByText("Net VAT")).toBeTruthy();
    expect(screen.getByTestId("vat-output").textContent).toMatch(/22,500\.50/);
    expect(screen.getByTestId("vat-input").textContent).toMatch(/4,500\.25/);
    expect(screen.getByTestId("vat-net").textContent).toMatch(/18,000\.25/);
    expect(screen.getByText(/\(2 invoices\)/)).toBeTruthy();
    expect(screen.getByText(/\(1 expense\)/)).toBeTruthy();

    expectNoCitComputation();
    expect(screen.queryByTestId("vat-legacy-notice")).toBeNull();
  });

  it("shows a negative net VAT when input VAT is higher", async () => {
    const data = { ...VAT_DATA, output_vat: 100, input_vat: 250, net_vat: -150 };
    vi.mocked(fetch).mockResolvedValue(
      respond({ ...BASE, ...data, report_type: "vat", computation_data: data }),
    );

    render(<TaxReportDetailPage />);

    await screen.findByText("VAT Summary");
    expect(screen.getByTestId("vat-net").textContent).toMatch(/-.*150\.00/);
  });

  it("tells the user an old VAT report used the income tax computation and regenerates on request", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(respond(legacyVatReport))
      .mockResolvedValueOnce(respond(vatReport));

    render(<TaxReportDetailPage />);

    const notice = await screen.findByTestId("vat-legacy-notice");
    expect(notice.textContent).toMatch(
      /generated with the income tax computation/,
    );
    // Nothing is recomputed silently, and the CIT figures are not shown.
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("VAT Summary")).toBeNull();
    expectNoCitComputation();

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));

    await screen.findByText("VAT Summary");
    expect(vi.mocked(fetch).mock.calls[1]).toEqual([
      "/api/tax-reports/rep-1/regenerate",
      { method: "POST" },
    ]);
    expect(screen.getByTestId("vat-output").textContent).toMatch(/22,500\.50/);
    expect(screen.getByTestId("vat-input").textContent).toMatch(/4,500\.25/);
    expect(screen.getByTestId("vat-net").textContent).toMatch(/18,000\.25/);
    await waitFor(() => {
      expect(screen.queryByTestId("vat-legacy-notice")).toBeNull();
    });
    expectNoCitComputation();
  });

  it("leaves the income tax report page as it was", async () => {
    vi.mocked(fetch).mockResolvedValue(respond(citReport));

    render(<TaxReportDetailPage />);

    await screen.findByText("Tax Computation Summary");
    expect(screen.getByRole("heading", { level: 1, name: "Tax Report 2026" })).toBeTruthy();
    for (const text of [
      "Business Classification",
      "Assessable Profit",
      "Taxable Income",
      "Income Tax",
      "Development Levy (4%)",
      "Total Tax Liability",
      "Effective Tax Rate",
      "Detailed Breakdown",
    ]) {
      expect(screen.getByText(text), text).toBeTruthy();
    }
    expect(document.body.textContent).toMatch(/2,040,000\.00/);
    expect(document.body.textContent).toMatch(/20\.40%/);
    expect(screen.queryByText("VAT Summary")).toBeNull();
    expect(screen.queryByTestId("vat-legacy-notice")).toBeNull();
    expect(screen.queryByRole("button", { name: "Regenerate" })).toBeNull();
  });
});
