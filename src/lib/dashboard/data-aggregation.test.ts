import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase server client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => {
    const chainable = {
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
    };

    // Make each method return the chainable object
    mockSelect.mockReturnValue(chainable);
    mockEq.mockReturnValue(chainable);
    mockGte.mockReturnValue(chainable);
    mockLte.mockReturnValue({ data: [] });

    mockFrom.mockReturnValue(chainable);

    return Promise.resolve({ from: mockFrom });
  }),
}));

import {
  getMonthlyIncomeExpenses,
  type MonthlyIncomeExpense,
} from "./data-aggregation";

describe("getMonthlyIncomeExpenses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array of MonthlyIncomeExpense objects", async () => {
    mockLte.mockResolvedValue({ data: [] });

    const result = await getMonthlyIncomeExpenses("user-123", 3);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
  });

  it("each result has month, income, and expenses fields", async () => {
    mockLte.mockResolvedValue({ data: [] });

    const result = await getMonthlyIncomeExpenses("user-123", 1);

    expect(result[0]).toHaveProperty("month");
    expect(result[0]).toHaveProperty("income");
    expect(result[0]).toHaveProperty("expenses");
  });

  it("returns zeros when no transactions exist", async () => {
    mockLte.mockResolvedValue({ data: [] });

    const result = await getMonthlyIncomeExpenses("user-123", 2);

    result.forEach((item: MonthlyIncomeExpense) => {
      expect(item.income).toBe(0);
      expect(item.expenses).toBe(0);
    });
  });

  it("correctly sums transaction amounts for income", async () => {
    // First call for income data returns amounts
    mockLte
      .mockResolvedValueOnce({ data: [{ amount: 1000 }, { amount: 2000 }] })
      // Second call for expense data
      .mockResolvedValueOnce({ data: [{ amount: 500 }] });

    const result = await getMonthlyIncomeExpenses("user-123", 1);

    expect(result[0].income).toBe(3000);
    expect(result[0].expenses).toBe(500);
  });

  it("handles null data gracefully", async () => {
    mockLte.mockResolvedValue({ data: null });

    const result = await getMonthlyIncomeExpenses("user-123", 1);

    expect(result[0].income).toBe(0);
    expect(result[0].expenses).toBe(0);
  });

  it("rounds amounts to whole numbers", async () => {
    mockLte
      .mockResolvedValueOnce({
        data: [{ amount: 1000.55 }, { amount: 2000.45 }],
      })
      .mockResolvedValueOnce({ data: [] });

    const result = await getMonthlyIncomeExpenses("user-123", 1);

    expect(result[0].income).toBe(3001);
  });

  it("queries with correct user_id", async () => {
    mockLte.mockResolvedValue({ data: [] });

    await getMonthlyIncomeExpenses("specific-user-id", 1);

    expect(mockEq).toHaveBeenCalledWith("user_id", "specific-user-id");
  });
});
