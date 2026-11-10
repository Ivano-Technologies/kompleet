/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TaxReportDetailPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useParams: () => ({ id: "report-1" }),
}));

vi.mock("@/components/ui/error-toast", () => ({
  notifyError: vi.fn(),
}));

function baseReport(
  computation: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "report-1",
    report_type: "CIT",
    tax_year: 2026,
    period_start: "2026-01-01",
    period_end: "2026-12-31",
    business_classification: "Other Company",
    qualifies_as_small_company: false,
    total_revenue: 60_000_000,
    total_expenses: 20_000_000,
    assessable_profit: 40_000_000,
    taxable_income: 40_000_000,
    income_tax: 12_000_000,
    development_levy: 1_600_000,
    total_tax_liability: 13_600_000,
    effective_tax_rate: 22.67,
    status: "draft",
    created_at: "2026-02-01T00:00:00.000Z",
    computation_data: {
      taxBreakdown: [],
      reliefs: [],
      exemptions: [],
      filingRequirements: [],
      nextSteps: [],
      deductibleExpenses: 20_000_000,
      unverifiedRuleKeys: [],
      minimumEtrTopUp: 0,
      ...computation,
    },
  };
}

describe("Tax report detail unverified-rule warning", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a light-theme warning listing unverified rule keys", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        report: baseReport({
          unverifiedRuleKeys: [
            "business_tax.minimum_etr",
            "business_tax.very_large_turnover_threshold",
          ],
        }),
      }),
    } as Response);

    render(<TaxReportDetailPage />);

    const banner = await screen.findByTestId("unverified-rules-warning");
    expect(banner).toHaveTextContent("Unverified tax rules");
    expect(banner).toHaveTextContent("business_tax.minimum_etr");
    expect(banner).toHaveTextContent(
      "business_tax.very_large_turnover_threshold",
    );
    expect(banner.className).toContain("bg-amber-50");
    expect(banner.className).not.toMatch(/\bdark:/);
  });

  it("does not render the warning when every used rule is verified", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ report: baseReport() }),
    } as Response);

    render(<TaxReportDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Tax Report 2026")).toBeTruthy();
    });
    expect(screen.queryByTestId("unverified-rules-warning")).toBeNull();
  });
});
