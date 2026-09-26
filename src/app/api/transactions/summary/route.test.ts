/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireAuthedConvex = vi.fn();
const listAllTransactionsMine = vi.fn();

vi.mock("@/lib/convex/server", () => ({
  requireAuthedConvex: (...args: unknown[]) => requireAuthedConvex(...args),
  isUnauthorized: (error: unknown) =>
    error instanceof Error && /unauthorized/i.test(error.message),
}));

vi.mock("@/lib/convex/money-lists", () => ({
  listAllTransactionsMine: (...args: unknown[]) =>
    listAllTransactionsMine(...args),
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: (handler: (req: NextRequest) => Promise<Response>) => handler,
}));

import { GET } from "./route";

function request(query = "startDate=2026-07-01&endDate=2026-09-30"): NextRequest {
  return new NextRequest(`http://localhost/api/transactions/summary?${query}`);
}

describe("GET /api/transactions/summary", () => {
  beforeEach(() => {
    requireAuthedConvex.mockReset();
    listAllTransactionsMine.mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    requireAuthedConvex.mockRejectedValue(new Error("Unauthorized"));
    const res = await GET(request());
    expect(res.status).toBe(401);
  });

  it("returns 200 with zeros when the period has no books", async () => {
    requireAuthedConvex.mockResolvedValue({ convex: {} });
    listAllTransactionsMine.mockResolvedValue({ transactions: [], total: 0 });
    const res = await GET(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      income: 0,
      expenses: 0,
      turnover: 0,
      count: 0,
      uncategorized: 0,
    });
  });

  it("returns 200 totals from listMine (deployed) instead of summaryForPeriod", async () => {
    requireAuthedConvex.mockResolvedValue({ convex: {} });
    listAllTransactionsMine.mockResolvedValue({
      transactions: [
        {
          transaction_type: "credit",
          amount: 1000,
          category_id: "c1",
          category: { id: "c1" },
          confidence_score: 90,
        },
        {
          transaction_type: "debit",
          amount: 250,
          category_id: null,
          category: null,
          confidence_score: null,
        },
      ],
      total: 2,
    });
    const res = await GET(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      income: 1000,
      expenses: 250,
      turnover: 1000,
      count: 2,
      uncategorized: 1,
    });
    expect(listAllTransactionsMine).toHaveBeenCalledWith(
      {},
      { startDate: "2026-07-01", endDate: "2026-09-30" },
    );
  });

  it("returns 200 empty payload when listMine throws (not 500)", async () => {
    requireAuthedConvex.mockResolvedValue({ convex: {} });
    listAllTransactionsMine.mockRejectedValue(
      new Error('Could not find public function for "transactions:summaryForPeriod"'),
    );
    const res = await GET(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      income: 0,
      expenses: 0,
      turnover: 0,
      count: 0,
      uncategorized: 0,
    });
  });
});
