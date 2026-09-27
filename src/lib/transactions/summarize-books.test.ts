import { describe, expect, it } from "vitest";
import {
  emptyBooksSummary,
  summarizeBooksTransactions,
} from "./summarize-books";

describe("summarizeBooksTransactions", () => {
  it("returns zeros for an empty ledger", () => {
    expect(summarizeBooksTransactions([])).toEqual(emptyBooksSummary());
  });

  it("splits credits/debits and counts uncategorized", () => {
    const summary = summarizeBooksTransactions([
      {
        transaction_type: "credit",
        amount: 4_820_000,
        category_id: "cat-1",
        category: { id: "cat-1" },
        confidence_score: 95,
      },
      {
        transaction_type: "debit",
        amount: 2_140_500,
        category_id: null,
        category: null,
        confidence_score: null,
      },
      {
        transaction_type: "debit",
        amount: 10_000,
        category_id: "cat-2",
        category: { id: "cat-2" },
        confidence_score: 40,
      },
    ]);
    expect(summary).toEqual({
      income: 4_820_000,
      expenses: 2_150_500,
      turnover: 4_820_000,
      count: 3,
      uncategorized: 2,
    });
  });
});
