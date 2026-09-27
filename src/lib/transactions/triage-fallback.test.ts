import { describe, expect, it } from "vitest";
import { isMissingConvexFunction } from "./triage-fallback";

describe("triage Convex fallback", () => {
  it("detects undeployed triage functions", () => {
    expect(
      isMissingConvexFunction(
        new Error("Could not find public function for 'transactions:listTriageMine'"),
      ),
    ).toBe(true);
    expect(isMissingConvexFunction(new Error("Unauthorized"))).toBe(false);
  });
});
