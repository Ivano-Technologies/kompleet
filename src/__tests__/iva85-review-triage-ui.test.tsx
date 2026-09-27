/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExceptionBanner, ImportToast } from "@/components/import/ImportToast";
import { TriageSheet } from "@/components/review/TriageSheet";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const rows = [
  {
    id: "t1",
    kind: "transaction",
    merchant: "Jumia Foods · Lagos",
    amount: 8750,
    transactionType: "debit",
    date: "2026-09-22",
    bankMeta: "POS PURCHASE",
    reason: "uncategorised",
    suggestedCategory: null,
    category: null,
    confidenceScore: null,
  },
  {
    id: "t2",
    kind: "transaction",
    merchant: "Flutterwave · Settlement",
    amount: 125400,
    transactionType: "credit",
    date: "2026-09-21",
    bankMeta: "TRANSFER",
    reason: "low_confidence",
    suggestedCategory: { id: "sales", name: "Sales" },
    category: { id: "sales", name: "Sales" },
    confidenceScore: 42,
  },
  {
    id: "d1",
    kind: "duplicate",
    merchant: "Uber Trips · Sep batch",
    amount: 14200,
    transactionType: "debit",
    date: "2026-09-20",
    bankMeta: "CARD",
    reason: "duplicate_suspect",
    suggestedCategory: null,
    category: null,
    confidenceScore: null,
  },
];

describe("IVA-85 review triage UI", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === "POST") {
          return {
            ok: true,
            json: async () => ({
              success: true,
              snapshot: {
                kind: "transaction",
                id: "t1",
                categoryId: null,
                confidenceScore: null,
                triageIgnored: false,
                duplicateStatus: null,
                createdTransactionId: null,
              },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            items: rows,
            counts: {
              needsCheck: 3,
              uncategorised: 1,
              lowConfidence: 1,
              duplicateSuspect: 1,
            },
            categories: [
              { id: "meals", name: "Meals & entertainment" },
              { id: "sales", name: "Sales" },
            ],
          }),
        };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hides the banner when N is 0 and opens triage from the banner", async () => {
    const { rerender } = render(
      <ExceptionBanner needsCheckCount={0} duplicatesCount={0} />,
    );
    expect(screen.queryByText("0 need a quick check")).toBeNull();

    const onReview = vi.fn();
    rerender(
      <ExceptionBanner
        needsCheckCount={12}
        duplicatesCount={0}
        onReview={onReview}
      />,
    );
    expect(screen.getByText("12 need a quick check")).toBeTruthy();
    const review = screen.getByText("Review");
    expect(review.className).not.toMatch(/bg-accent|btn-primary/);
    await userEvent.click(screen.getByRole("button", { name: /12 need a quick check/i }));
    expect(onReview).toHaveBeenCalled();
  });

  it("renders one primary per row, picker, and undo toast", async () => {
    render(<TriageSheet open onClose={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText("Jumia Foods · Lagos")).toBeTruthy();
    });
    expect(screen.getByRole("heading", { name: "Quick check" })).toBeTruthy();
    expect(screen.getByText("3 to review")).toBeTruthy();
    expect(screen.getByText("Uncategorised")).toBeTruthy();
    expect(screen.getByText("Low confidence")).toBeTruthy();
    expect(screen.getByText("Duplicate suspect")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Categorise" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Confirm" })).toHaveLength(2);
    expect(screen.getByText("Ignore all low-confidence")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Categorise" }));
    expect(screen.getByPlaceholderText("Search categories")).toBeTruthy();
    await userEvent.click(screen.getByText("Meals & entertainment"));
    await waitFor(() => {
      expect(screen.getByText("Categorised as Meals & entertainment")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Undo" })).toBeTruthy();
    });
  });

  it("opens the same sheet from the post-import Fix toast", async () => {
    const onFix = vi.fn();
    render(
      <ImportToast
        result={{ imported: 4, pendingReview: 2, duplicates: 0 }}
        onDismiss={() => undefined}
        onFixReview={onFix}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fix 2 uncategorized" }));
    expect(onFix).toHaveBeenCalled();
  });
});
