/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionsPage from "./page";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
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

vi.mock("@/components/review/CategoryPicker", () => ({
  CategoryPicker: ({
    categories,
    onPick,
  }: {
    categories: Array<{ id: string; name: string }>;
    onPick: (category: { id: string; name: string }) => void;
  }) => (
    <div>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onPick(category)}
        >
          {category.name}
        </button>
      ))}
    </div>
  ),
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
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.startsWith("/api/transactions?") && method === "GET") {
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
      if (url === "/api/categories") {
        return {
          ok: true,
          json: async () => ({
            categories: [{ id: "cat-sales", name: "Sales Revenue" }],
          }),
        };
      }
      if (url === "/api/transactions/triage" && method === "POST") {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      if (url.startsWith("/api/transactions/") && method === "DELETE") {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      throw new Error(`unexpected fetch: ${method} ${url}`);
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

describe("books row actions menu", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens Edit, Delete with confirm, and Categorise from the row menu", async () => {
    push.mockReset();
    mockList([
      row({
        id: "txn-menu-1",
        description: "Audit test sale — made-up",
        category: sales,
      }),
    ]);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<TransactionsPage />);
    await waitFor(() => {
      expect(screen.getByText("Audit test sale — made-up")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Transaction actions" }),
    );
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Categorise" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(push).toHaveBeenCalledWith("/transactions/txn-menu-1?edit=1");

    await user.click(
      screen.getByRole("button", { name: "Transaction actions" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(vi.mocked(fetch).mock.calls.some(([url, init]) =>
        String(url) === "/api/transactions/txn-menu-1" &&
        (init as RequestInit | undefined)?.method === "DELETE",
      )).toBe(true);
    });

    await user.click(
      screen.getByRole("button", { name: "Transaction actions" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Categorise" }));
    await user.click(await screen.findByRole("button", { name: "Sales Revenue" }));
    await waitFor(() => {
      const triage = vi.mocked(fetch).mock.calls.find(
        ([url, init]) =>
          String(url) === "/api/transactions/triage" &&
          (init as RequestInit | undefined)?.method === "POST",
      );
      expect(triage).toBeTruthy();
      expect(JSON.parse(String((triage?.[1] as RequestInit).body))).toMatchObject({
        op: "categorise",
        id: "txn-menu-1",
        categoryId: "cat-sales",
      });
    });
    confirmSpy.mockRestore();
  });
});
