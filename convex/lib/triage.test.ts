import { describe, expect, it } from "vitest";
import { transactionTriageReason } from "./triage";

describe("convex triage classification", () => {
  it("skips ignored rows and splits uncategorised vs low confidence", () => {
    expect(transactionTriageReason({})).toBe("uncategorised");
    expect(
      transactionTriageReason({ categoryId: "c1", confidenceScore: 20 }),
    ).toBe("low_confidence");
    expect(
      transactionTriageReason({ categoryId: "c1", confidenceScore: 90 }),
    ).toBeNull();
    expect(transactionTriageReason({ triageIgnoredAt: 12 })).toBeNull();
  });
});
