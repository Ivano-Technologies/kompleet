/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/import/StatementDropZone", () => ({
  StatementDropZone: () => <div>Statement drop zone</div>,
  triggerStatementPicker: vi.fn(),
}));

vi.mock("@/components/dashboard/SetupChecklist", () => ({
  SetupChecklist: () => null,
}));

vi.mock("@/components/review/TriageSheet", () => ({
  TriageSheet: () => null,
  useTriageCount: () => ({
    counts: { needsCheck: 0, uncategorised: 0, duplicateSuspect: 0 },
    setCounts: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("recharts", () => ({
  Bar: () => null,
  BarChart: () => null,
  CartesianGrid: () => null,
  ResponsiveContainer: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

import DashboardClient from "@/app/(dashboard)/dashboard/DashboardClient";

const emptyKpis = {
  totalRevenue: 0,
  totalExpenses: 0,
  revenueChange: 0,
  estimatedTax: 0,
  taxDueDate: "Oct 21",
  outstandingInvoices: 0,
  pendingCount: 0,
  netProfit: 0,
  profitChange: 0,
};

describe("IVA-86 empty dashboard", () => {
  it("omits ₦0 KPI cards, chart, and recent list when hasRealBooks is false", () => {
    render(
      <DashboardClient
        userId="user-1"
        kpiData={emptyKpis}
        revenueData={[{ month: "Sep", revenue: 0, expenses: 0 }]}
        recentTransactions={[
          {
            id: "seed",
            desc: "Fixture row",
            amount: 0,
            type: "credit",
            date: "Sep 1, 2026",
            relative: "Today",
            status: "pending",
          },
        ]}
        hasRealBooks={false}
        uncategorizedCount={0}
        duplicatesCount={0}
      />,
    );

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeTruthy();
    expect(screen.getByText("Statement drop zone")).toBeTruthy();
    expect(screen.queryByText("Revenue")).toBeNull();
    expect(screen.queryByText("Expenses")).toBeNull();
    expect(screen.queryByText("Net")).toBeNull();
    expect(screen.queryByText("Revenue trend")).toBeNull();
    expect(screen.queryByText("Recent transactions")).toBeNull();
    expect(screen.queryByText("Fixture row")).toBeNull();
    expect(screen.queryByText("₦0")).toBeNull();
    expect(screen.queryByText("Demo data")).toBeNull();
  });

  it("chips Demo data when demo mode is explicitly on", () => {
    render(
      <DashboardClient
        userId="user-1"
        kpiData={emptyKpis}
        revenueData={[]}
        recentTransactions={[]}
        hasRealBooks={false}
        demoMode
        uncategorizedCount={0}
        duplicatesCount={0}
      />,
    );
    expect(screen.getByText("Demo data")).toBeTruthy();
  });
});
