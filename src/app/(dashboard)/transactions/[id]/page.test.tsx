/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TransactionDetailsPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ id: "txn-manual-1" }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/documents/AttachFileButton", () => ({
  AttachFileButton: () => null,
}));

const naira = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    amount,
  );

type Fixture = {
  id: string;
  transaction_date: string;
  description: string;
  amount: number;
  transaction_type: "debit" | "credit";
  balance?: number | null;
  category?: {
    id: string;
    name: string;
    category_type: string;
    tax_treatment: string;
  } | null;
  confidence_score?: number | null;
  reference?: string | null;
  notes?: string | null;
  source?: string | null;
  is_reconciled: boolean;
  created_at: string;
};

function baseTransaction(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "txn-manual-1",
    transaction_date: "2026-11-10",
    description: "POS PURCHASE JUMIA",
    amount: 8750,
    transaction_type: "debit",
    balance: null,
    category: {
      id: "cat-sales",
      name: "Sales",
      category_type: "income",
      tax_treatment: "taxable",
    },
    confidence_score: null,
    reference: null,
    notes: null,
    source: "manual",
    is_reconciled: false,
    created_at: "2026-11-10T09:00:00.000Z",
    ...overrides,
  };
}

function mockApis(transaction: Fixture) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.startsWith("/api/transactions/")) {
        return {
          ok: true,
          json: async () => ({ transaction }),
        };
      }
      if (url.startsWith("/api/categories")) {
        return {
          ok: true,
          json: async () => ({ categories: [] }),
        };
      }
      throw new Error(`unexpected fetch: ${url}`);
    }),
  );
}

describe("transaction detail optional numbers (C3 / 15)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hides the balance row and confidence hint when API sends null", async () => {
    mockApis(baseTransaction({ balance: null, confidence_score: null }));
    render(<TransactionDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("POS PURCHASE JUMIA")).toBeInTheDocument();
    });

    expect(screen.queryByText("Balance after transaction:")).toBeNull();
    expect(screen.queryByText(naira(0))).toBeNull();
    expect(screen.queryByText(/\(\s*% confidence\)/)).toBeNull();
    expect(screen.queryByText("(%)")).toBeNull();
  });

  it("hides the balance row when the field is omitted", async () => {
    const { balance: _omit, ...withoutBalance } = baseTransaction();
    mockApis(withoutBalance);
    render(<TransactionDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("POS PURCHASE JUMIA")).toBeInTheDocument();
    });

    expect(screen.queryByText("Balance after transaction:")).toBeNull();
  });

  it("still shows a real 0 balance and 0% confidence", async () => {
    mockApis(
      baseTransaction({
        balance: 0,
        confidence_score: 0,
      }),
    );
    render(<TransactionDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Balance after transaction:")).toBeInTheDocument();
    });

    expect(screen.getByText(naira(0))).toBeInTheDocument();
    expect(screen.getByText("(0% confidence)")).toBeInTheDocument();
  });

  it("shows a non-zero running balance and a partial confidence score", async () => {
    mockApis(
      baseTransaction({
        balance: 12_500.5,
        confidence_score: 85,
      }),
    );
    render(<TransactionDetailsPage />);

    await waitFor(() => {
      expect(screen.getByText("Balance after transaction:")).toBeInTheDocument();
    });

    expect(screen.getByText(naira(12_500.5))).toBeInTheDocument();
    expect(screen.getByText("(85% confidence)")).toBeInTheDocument();
  });
});
