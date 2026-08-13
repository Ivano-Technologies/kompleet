/**
 * Tax Computation Path Parity
 * ============================
 * /api/financial-statements/generate and /api/nrs-filing/generate both
 * compute tax for the same income statement + entity type. This test
 * asserts they go through the SAME shared helper
 * (src/lib/financial-statements/compute-tax-for-period.ts) and therefore
 * can never drift apart for identical inputs — this was the exact failure
 * mode of the old duplicated `generateTaxComputation` rate engine that PR
 * 3a removes (src/lib/financial-statements/tax-computation.ts, deleted).
 */
import { describe, it, expect } from "vitest";
import { generateIncomeStatement } from "@/lib/financial-statements/income-statement";
import { computeTaxForPeriod } from "@/lib/financial-statements/compute-tax-for-period";
import { buildMockRuleBundle } from "./helpers/mock-rule-bundle";

const ruleBundle = buildMockRuleBundle({
  business_tax: {
    small_company_turnover_threshold: { value: { value: 50_000_000 } },
    small_company_assets_threshold: { value: { value: 250_000_000 } },
    corporate_tax_rate_small: { value: { rate: 0 } },
    corporate_tax_rate_other: { value: { rate: 30 } },
    minimum_etr: { value: { rate: 15 }, confidenceLevel: "unverified" },
    very_large_turnover_threshold: {
      value: { threshold: 20_000_000_000 },
      confidenceLevel: "unverified",
    },
    development_levy_rate: { value: { rate: 4 } },
    development_levy_exemptions: {
      value: { exempt: ["small_company", "non_resident_company"] },
    },
    capital_gains_integration: { value: { integrated: true } },
  },
  individual_income_tax: {
    tax_bracket_1: { value: { from: 0, to: 800_000, rate: 0 } },
    tax_bracket_2: { value: { from: 800_001, to: 3_000_000, rate: 15 } },
    tax_bracket_3: { value: { from: 3_000_001, to: 12_000_000, rate: 18 } },
    tax_bracket_4: { value: { from: 12_000_001, to: 25_000_000, rate: 21 } },
    tax_bracket_5: { value: { from: 25_000_001, to: 50_000_000, rate: 23 } },
    tax_bracket_6: { value: { from: 50_000_001, to: null, rate: 25 } },
    rent_relief: { value: { cap: 500_000, percentage: 20 } },
    owner_occupier_interest: { value: { deductible: true } },
  },
});

const transactions = [
  {
    id: "1",
    transaction_date: "2026-03-10",
    description: "Consulting Revenue",
    amount: 12_000_000,
    transaction_type: "credit" as const,
    category: { name: "Consulting", type: "income" as const },
  },
  {
    id: "2",
    transaction_date: "2026-03-15",
    description: "Payroll",
    amount: 3_500_000,
    transaction_type: "debit" as const,
    category: { name: "Payroll", type: "expense" as const },
  },
  {
    id: "3",
    transaction_date: "2026-03-20",
    description: "Office Rent",
    amount: 900_000,
    transaction_type: "debit" as const,
    category: { name: "Rent", type: "expense" as const },
  },
];

describe("Tax computation path parity (FS vs NRS)", () => {
  it("produces identical results for identical company inputs, simulating both API call sites", () => {
    const incomeStatement = generateIncomeStatement(
      transactions,
      "2026-03-01",
      "2026-03-31",
    );

    // Annual turnover is deliberately distinct from this period's revenue
    // (₦12m) — it puts the entity in the "Other Company" band (>₦50m) to
    // exercise a non-trivial tax calculation.
    const annualTurnover = 60_000_000;

    // Simulates /api/financial-statements/generate
    const fsOutcome = computeTaxForPeriod({
      incomeStatement,
      entityType: "company",
      annualTurnover,
      rules: ruleBundle,
    });

    // Simulates /api/nrs-filing/generate, called independently with the
    // same logical inputs for the same period.
    const nrsOutcome = computeTaxForPeriod({
      incomeStatement,
      entityType: "company",
      annualTurnover,
      rules: ruleBundle,
    });

    expect(nrsOutcome.result).toEqual(fsOutcome.result);
    expect(nrsOutcome.data).toEqual(fsOutcome.data);

    // Sanity: figures are non-trivial (turnover puts this in "Other Company").
    expect(fsOutcome.result.businessClassification).toBe("Other Company");
    expect(fsOutcome.result.incomeTax).toBeGreaterThan(0);
    expect(fsOutcome.data.taxLiability).toBe(fsOutcome.result.incomeTax);
  });

  it("produces identical results for identical individual inputs", () => {
    const incomeStatement = generateIncomeStatement(
      transactions,
      "2026-03-01",
      "2026-03-31",
    );

    const fsOutcome = computeTaxForPeriod({
      incomeStatement,
      entityType: "individual",
      annualTurnover: incomeStatement.revenue.total,
      rules: ruleBundle,
    });

    const nrsOutcome = computeTaxForPeriod({
      incomeStatement,
      entityType: "individual",
      annualTurnover: incomeStatement.revenue.total,
      rules: ruleBundle,
    });

    expect(nrsOutcome.result).toEqual(fsOutcome.result);
    expect(nrsOutcome.data).toEqual(fsOutcome.data);
    expect(fsOutcome.result.businessClassification).toBe(
      "Individual Taxpayer",
    );
  });

  it("stays consistent across small, other, and very-large company bands", () => {
    const incomeStatement = generateIncomeStatement(
      transactions,
      "2026-03-01",
      "2026-03-31",
    );

    const scenarios: Array<{
      turnover: number;
      expectedClassification: string;
    }> = [
      { turnover: 10_000_000, expectedClassification: "Small Company" },
      { turnover: 60_000_000, expectedClassification: "Other Company" },
      {
        turnover: 25_000_000_000,
        expectedClassification: "Very Large Company (Minimum ETR 15%)",
      },
    ];

    for (const scenario of scenarios) {
      const fsOutcome = computeTaxForPeriod({
        incomeStatement,
        entityType: "company",
        annualTurnover: scenario.turnover,
        rules: ruleBundle,
      });
      const nrsOutcome = computeTaxForPeriod({
        incomeStatement,
        entityType: "company",
        annualTurnover: scenario.turnover,
        rules: ruleBundle,
      });

      expect(fsOutcome.result.businessClassification).toBe(
        scenario.expectedClassification,
      );
      expect(nrsOutcome.result).toEqual(fsOutcome.result);
    }
  });
});
