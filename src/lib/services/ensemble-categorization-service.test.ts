import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CategoryOption } from "./ensemble-categorization-service";

vi.mock("./llm-categorization-service", () => ({
  llmCategorize: vi.fn(),
  llmBatchCategorize: vi.fn(),
}));

import { llmCategorize } from "./llm-categorization-service";
import { ensembleCategorize } from "./ensemble-categorization-service";

const mockedLlmCategorize = vi.mocked(llmCategorize);

/** Mirrors the Nigerian keyword seeds in 20260804120100_categories_keywords.sql */
const seededCategories: CategoryOption[] = [
  {
    name: "Bank Charges",
    type: "expense",
    tax_treatment: "deductible",
    keywords: [
      "gtbank",
      "gtb",
      "zenith",
      "uba",
      "bank charge",
      "stamp duty",
      "sms charge",
    ],
  },
  {
    name: "Entertainment",
    type: "expense",
    tax_treatment: "non_deductible",
    keywords: ["dstv", "gotv", "netflix", "showmax", "cinema"],
  },
  {
    name: "Insurance",
    type: "expense",
    tax_treatment: "deductible",
    keywords: ["leadway", "aiico", "insurance", "premium"],
  },
];

describe("ensembleCategorize — rules tier + LLM fallthrough", () => {
  beforeEach(() => {
    mockedLlmCategorize.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("rules tier returns a real category for a seeded Nigerian merchant (method RULE)", async () => {
    // Before #57, ruleCategorize passed keywords: [] and always returned null.
    // A match here is direct proof the dead-tier fix landed.
    mockedLlmCategorize.mockRejectedValue(
      new Error("provider unavailable (simulated)"),
    );

    const result = await ensembleCategorize(
      {
        merchant: "DSTV SUBSCRIPTION",
        amount: 15000,
        type: "debit",
        description: "DSTV SUBSCRIPTION",
      },
      seededCategories,
    );

    expect(result.method).toBe("RULE");
    expect(result.category).toBe("Entertainment");
    expect(result.confidence).toBeGreaterThan(0);
    expect(["SUGGEST", "MANUAL_REVIEW", "AUTO_ACCEPT"]).toContain(
      result.recommendation,
    );
  });

  it("provider failure falls through to rules rather than throwing", async () => {
    mockedLlmCategorize.mockRejectedValue(
      new Error("Claude API 503 (simulated)"),
    );

    // Single whole-word keyword match → confidence below AUTO_ACCEPT (80).
    const result = await ensembleCategorize(
      {
        merchant: "Monthly account sms charge",
        amount: 50,
        type: "debit",
        description: "Monthly account sms charge",
      },
      seededCategories,
    );

    expect(result.method).toBe("RULE");
    expect(result.category).toBe("Bank Charges");
    expect(["SUGGEST", "MANUAL_REVIEW"]).toContain(result.recommendation);
  });
});
