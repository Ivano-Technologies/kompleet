/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TransactionsPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
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

vi.mock("@/components/import/AddManualTransaction", () => ({
  AddManualTransaction: () => null,
}));

vi.mock("@/components/review/TriageSheet", () => ({
  TriageSheet: () => null,
  useTriageCount: () => ({
    counts: { needsCheck: 0, uncategorised: 0, duplicateSuspect: 0 },
    setCounts: vi.fn(),
    refresh: vi.fn(),
  }),
}));

type ListRow = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "debit" | "credit";
  balance?: number | null;
  category?: { id: string; name: string; category_type: string } | null;
  confidence_score?: number | null;
  is_reconciled: boolean;
};

const sales = { id: "cat-sales", name: "Sales", category_type: "income" };

function row(overrides: Partial<ListRow>): ListRow {
  return {
    id: "txn-1",
    transaction_date: "2026-11-10",
    description: "Fixture row",
    amount: 1000,
    transaction_type: "debit",
    is_reconciled: false,
    ...overrides,
  };
}

function mockList(transactions: ListRow[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.startsWith("/api/transactions?")) {
        return {
          ok: true,
          json: async () => ({
            transactions,
            pagination: {
              limit: 50,
              total: transactions.length,
              nextCursor: null,
              isDone: true,
            },
          }),
        };
      }
      throw new Error(`unexpected fetch: ${url}`);
    }),
  );
}

describe("books list optional confidence (C3 / 15)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hides the (%) hint when confidence_score is null or omitted, and still shows 0%", async () => {
    mockList([
      row({
        id: "manual-null",
        description: "Manual POS Jumia",
        category: sales,
        confidence_score: null,
        balance: null,
      }),
      row({
        id: "omitted",
        description: "Imported with no score",
        category: sales,
      }),
      row({
        id: "zero-score",
        description: "Zero confidence transfer",
        category: sales,
        confidence_score: 0,
        balance: 0,
      }),
      row({
        id: "partial",
        description: "GTBank settlement",
        category: sales,
        confidence_score: 42,
        balance: 4800,
      }),
    ]);

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText("Manual POS Jumia")).toBeInTheDocument();
    });

    const manualCell = screen.getByText("Manual POS Jumia").closest("tr");
    const omittedCell = screen.getByText("Imported with no score").closest("tr");
    const zeroCell = screen.getByText("Zero confidence transfer").closest("tr");
    const partialCell = screen.getByText("GTBank settlement").closest("tr");

    expect(manualCell?.textContent).not.toMatch(/\(%\)/);
    expect(omittedCell?.textContent).not.toMatch(/\(%\)/);
    expect(zeroCell?.textContent).toMatch(/\(0%\)/);
    expect(partialCell?.textContent).toMatch(/\(42%\)/);
  });
});
