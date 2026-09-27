/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireAuthedConvex, withRateLimitImpl } = vi.hoisted(() => ({
  requireAuthedConvex: vi.fn(),
  withRateLimitImpl: vi.fn(<T,>(handler: T) => handler),
}));

vi.mock("@/lib/convex/server", () => ({
  requireAuthedConvex: (...args: unknown[]) => requireAuthedConvex(...args),
  isUnauthorized: (error: unknown) =>
    error instanceof Error &&
    (error.name === "ConvexUnauthorizedError" ||
      /unauthorized/i.test(error.message)),
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: <T,>(handler: T) => withRateLimitImpl(handler),
}));

import { POST } from "./route";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/transactions/triage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/transactions/triage", () => {
  beforeEach(() => {
    requireAuthedConvex.mockReset();
    withRateLimitImpl.mockImplementation(<T,>(handler: T) => handler);
  });

  it("returns 401 when Convex auth is missing", async () => {
    const err = Object.assign(new Error("Unauthorized"), {
      name: "ConvexUnauthorizedError",
    });
    requireAuthedConvex.mockRejectedValue(err);
    const res = await POST(
      request({
        op: "ignore",
        kind: "transaction",
        id: "t1",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("falls back to updateMine when applyTriageMine is undeployed", async () => {
    const convex = {
      query: vi.fn(async () => ({
        id: "t1",
        category_id: null,
        confidence_score: null,
        triage_ignored: false,
      })),
      mutation: vi.fn(async (_ref: unknown, args: { action?: string } = {}) => {
        if (args.action) {
          throw new Error(
            "Could not find public function for 'transactions:applyTriageMine'",
          );
        }
        return { id: "t1" };
      }),
    };
    requireAuthedConvex.mockResolvedValue({ convex });

    const res = await POST(
      request({
        op: "categorise",
        kind: "transaction",
        id: "t1",
        categoryId: "bank-charges",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      snapshot: { id: "t1", kind: "transaction" },
    });
  });
});
