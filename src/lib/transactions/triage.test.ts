import { describe, expect, it } from "vitest";
import {
  formatTriageAmount,
  formatTriageDate,
  suggestCategory,
  sumTriageCounts,
  titleCaseMerchant,
  transactionTriageReason,
} from "./triage";

describe("IVA-85 triage helpers", () => {
  it("classifies uncategorised, low confidence, and ignored rows", () => {
    expect(transactionTriageReason({ categoryId: null })).toBe("uncategorised");
    expect(
      transactionTriageReason({
        category: { id: "cat-1" },
        confidenceScore: 40,
      }),
    ).toBe("low_confidence");
    expect(
      transactionTriageReason({
        category: { id: "cat-1" },
        confidenceScore: 90,
      }),
    ).toBeNull();
    expect(
      transactionTriageReason({
        categoryId: null,
        triageIgnoredAt: 1,
      }),
    ).toBeNull();
  });

  it("title-cases bank strings and formats ₦ amounts", () => {
    expect(titleCaseMerchant("JUMIA FOODS · LAGOS")).toBe("Jumia Foods · Lagos");
    expect(formatTriageAmount(8750, "debit")).toMatch(/−.*8,750/);
    expect(formatTriageAmount(125400, "credit")).toMatch(/\+.*125,400/);
    expect(formatTriageDate("2026-09-22")).toBe("22 Sep 2026");
  });

  it("suggests a category from keywords and sums banner N", () => {
    const suggestion = suggestCategory("POS purchase at office supplies store", [
      { id: "1", name: "Office Supplies", keywords: ["stationery"] },
      { id: "2", name: "Sales Revenue" },
    ]);
    expect(suggestion?.name).toBe("Office Supplies");
    expect(
      sumTriageCounts({
        uncategorised: 2,
        lowConfidence: 3,
        duplicateSuspect: 1,
      }).needsCheck,
    ).toBe(6);
  });
});
