import { describe, expect, it, vi } from "vitest";
import {
  applyTriageFallback,
  isMissingConvexFunction,
  isTransientConvexError,
  withConvexRetry,
} from "./triage-fallback";

describe("triage Convex fallback", () => {
  it("detects undeployed triage functions", () => {
    expect(
      isMissingConvexFunction(
        new Error("Could not find public function for 'transactions:listTriageMine'"),
      ),
    ).toBe(true);
    expect(
      isMissingConvexFunction(
        new Error("Could not find public function for 'transactions:applyTriageMine'"),
      ),
    ).toBe(true);
    expect(isMissingConvexFunction(new Error("Unauthorized"))).toBe(false);
  });

  it("retries transient Convex server errors once", async () => {
    expect(isTransientConvexError(new Error("Server Error"))).toBe(true);
    const run = vi
      .fn()
      .mockRejectedValueOnce(new Error("[Request ID: x] Server Error"))
      .mockResolvedValueOnce("ok");
    await expect(withConvexRetry(run)).resolves.toBe("ok");
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("applies categorise via updateMine when triage mutations are missing", async () => {
    const convex = {
      query: vi.fn(async () => ({
        id: "t1",
        category_id: null,
        confidence_score: null,
        triage_ignored: false,
      })),
      mutation: vi.fn(async () => ({ id: "t1" })),
    };
    const result = await applyTriageFallback(convex as never, {
      op: "categorise",
      kind: "transaction",
      id: "t1",
      categoryId: "bank-charges",
    });
    expect(result.success).toBe(true);
    expect(result.snapshot?.id).toBe("t1");
    expect(convex.mutation).toHaveBeenCalled();
  });
});
