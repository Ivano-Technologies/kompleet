import { describe, it, expect, vi, beforeEach } from "vitest";

const mockQuery = vi.fn();

vi.mock("@/lib/convex/server", () => ({
  requireAuthedConvex: vi.fn(async () => ({
    convex: { query: mockQuery },
    user: { id: "user-123" },
    accessToken: "token",
  })),
}));

vi.mock("@/lib/convex/http", () => ({
  api: { transactions: { monthlyTotals: "transactions.monthlyTotals" } },
}));

import {
  getMonthlyIncomeExpenses,
  type MonthlyIncomeExpense,
} from "./data-aggregation";

function monthKey(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

describe("getMonthlyIncomeExpenses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array of MonthlyIncomeExpense objects", async () => {
    mockQuery.mockResolvedValue([
      { month: monthKey(2), income: 0, expenses: 0 },
      { month: monthKey(1), income: 0, expenses: 0 },
      { month: monthKey(0), income: 0, expenses: 0 },
    ]);

    const result = await getMonthlyIncomeExpenses("user-123", 3);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
  });

  it("each result has month, income, and expenses fields", async () => {
    mockQuery.mockResolvedValue([
      { month: monthKey(0), income: 0, expenses: 0 },
    ]);

    const result = await getMonthlyIncomeExpenses("user-123", 1);

    expect(result[0]).toHaveProperty("month");
    expect(result[0]).toHaveProperty("income");
    expect(result[0]).toHaveProperty("expenses");
  });

  it("returns zeros when no transactions exist", async () => {
    mockQuery.mockResolvedValue([
      { month: monthKey(1), income: 0, expenses: 0 },
      { month: monthKey(0), income: 0, expenses: 0 },
    ]);

    const result = await getMonthlyIncomeExpenses("user-123", 2);

    result.forEach((item: MonthlyIncomeExpense) => {
      expect(item.income).toBe(0);
      expect(item.expenses).toBe(0);
    });
  });

  it("correctly sums transaction amounts for income", async () => {
    mockQuery.mockResolvedValue([
      { month: monthKey(0), income: 3000, expenses: 500 },
    ]);

    const result = await getMonthlyIncomeExpenses("user-123", 1);

    expect(result[0].income).toBe(3000);
    expect(result[0].expenses).toBe(500);
  });

  it("handles empty buckets gracefully", async () => {
    mockQuery.mockResolvedValue([
      { month: monthKey(0), income: 0, expenses: 0 },
    ]);

    const result = await getMonthlyIncomeExpenses("user-123", 1);

    expect(result[0].income).toBe(0);
    expect(result[0].expenses).toBe(0);
  });

  it("rounds amounts to whole numbers", async () => {
    mockQuery.mockResolvedValue([
      { month: monthKey(0), income: 3000.7, expenses: 0 },
    ]);

    const result = await getMonthlyIncomeExpenses("user-123", 1);

    expect(result[0].income).toBe(3001);
  });

  it("requests the Convex monthly totals query", async () => {
    mockQuery.mockResolvedValue([
      { month: monthKey(0), income: 0, expenses: 0 },
    ]);

    await getMonthlyIncomeExpenses("specific-user-id", 1);

    expect(mockQuery).toHaveBeenCalledWith("transactions.monthlyTotals", {
      months: 1,
    });
  });
});
