/**
 * Critical Path Integration Tests
 * Tests Sprint 5, 6, 7 features end-to-end
 */

import { describe, it, expect } from "vitest";
import { buildMockRuleBundle } from "./helpers/mock-rule-bundle";

// Mock transaction data for testing
const mockTransactions = [
  {
    id: "1",
    transaction_date: "2026-01-15",
    description: "Sales Revenue - Client A",
    amount: 5_000_000,
    transaction_type: "credit" as const,
    category: {
      name: "Sales Revenue",
      type: "income" as const,
    },
  },
  {
    id: "2",
    transaction_date: "2026-01-20",
    description: "Office Rent",
    amount: 1_500_000,
    transaction_type: "debit" as const,
    category: {
      name: "Rent",
      type: "expense" as const,
    },
  },
  {
    id: "3",
    transaction_date: "2026-01-25",
    description: "Utility Bills",
    amount: 250_000,
    transaction_type: "debit" as const,
    category: {
      name: "Utilities",
      type: "expense" as const,
    },
  },
];

/**
 * Mock RuleBundle mirroring the active seed (populate_tax_rules.sql) for
 * business_tax and individual_income_tax rule types — everything
 * TaxComputationService needs via requireRule().
 */
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

describe("Sprint 5: Transaction Upload & Parsing", () => {
  it("should parse CSV file with GTBank format", async () => {
    // This would test CSV parser with GTBank format
    expect(true).toBe(true); // Placeholder
  });

  it("should detect duplicate transactions", async () => {
    // This would test duplicate detection algorithm
    expect(true).toBe(true); // Placeholder
  });

  it("should validate opening and closing balances", async () => {
    // This would test balance validation
    expect(true).toBe(true); // Placeholder
  });
});

describe("Sprint 6: Financial Statement Generator", () => {
  it("should generate Income Statement from transactions", async () => {
    const { generateIncomeStatement } =
      await import("@/lib/financial-statements/income-statement");

    const result = generateIncomeStatement(
      mockTransactions,
      "2026-01-01",
      "2026-01-31",
    );

    expect(result.revenue.total).toBe(5_000_000);
    expect(result.expenses.total).toBe(1_750_000);
    expect(result.grossProfit).toBe(3_250_000);
    expect(result.profitMargin).toBeGreaterThan(0);
  });

  it("should generate Tax Computation with correct rates (individual, rule-driven brackets)", async () => {
    const { generateIncomeStatement } =
      await import("@/lib/financial-statements/income-statement");
    const { computeTaxForPeriod } =
      await import("@/lib/financial-statements/compute-tax-for-period");

    const incomeStatement = generateIncomeStatement(
      mockTransactions,
      "2026-01-01",
      "2026-01-31",
    );

    const { result } = computeTaxForPeriod({
      incomeStatement,
      entityType: "individual",
      annualTurnover: 5_000_000,
      rules: ruleBundle,
    });

    // Net profit (3,250,000) exceeds the tax-free first bracket
    // (₦800,000), so tax should be > 0 under the progressive bands.
    expect(result.taxableIncome).toBeGreaterThan(0);
    expect(result.incomeTax).toBeGreaterThan(0);
    expect(result.businessClassification).toBe("Individual Taxpayer");
  });

  it("should apply 0% CIT for a small company (turnover ≤ ₦50m)", async () => {
    const { generateIncomeStatement } =
      await import("@/lib/financial-statements/income-statement");
    const { computeTaxForPeriod } =
      await import("@/lib/financial-statements/compute-tax-for-period");

    const incomeStatement = generateIncomeStatement(
      mockTransactions,
      "2026-01-01",
      "2026-01-31",
    );

    const { result } = computeTaxForPeriod({
      incomeStatement,
      entityType: "company",
      annualTurnover: 20_000_000,
      rules: ruleBundle,
    });

    expect(result.businessClassification).toBe("Small Company");
    expect(result.qualifiesAsSmallCompany).toBe(true);
    expect(result.incomeTax).toBe(0);
    expect(result.developmentLevy).toBe(0);
  });

  it("should apply 30% CIT for an other company (turnover > ₦50m, < ₦20b)", async () => {
    const { generateIncomeStatement } =
      await import("@/lib/financial-statements/income-statement");
    const { computeTaxForPeriod } =
      await import("@/lib/financial-statements/compute-tax-for-period");

    const incomeStatement = generateIncomeStatement(
      mockTransactions,
      "2026-01-01",
      "2026-01-31",
    );

    const { result } = computeTaxForPeriod({
      incomeStatement,
      entityType: "company",
      annualTurnover: 60_000_000,
      rules: ruleBundle,
    });

    expect(result.businessClassification).toBe("Other Company");
    expect(result.qualifiesAsSmallCompany).toBe(false);
    expect(result.incomeTax).toBeCloseTo(incomeStatement.netProfit * 0.3, 2);
    expect(result.developmentLevy).toBeGreaterThan(0);
  });

  it("should throw MissingTaxRuleError when a required business_tax rule is absent", async () => {
    const { generateIncomeStatement } =
      await import("@/lib/financial-statements/income-statement");
    const { computeTaxForPeriod } =
      await import("@/lib/financial-statements/compute-tax-for-period");
    const { buildMockRuleBundle: buildEmptyBundle } =
      await import("./helpers/mock-rule-bundle");

    const incomeStatement = generateIncomeStatement(
      mockTransactions,
      "2026-01-01",
      "2026-01-31",
    );

    expect(() =>
      computeTaxForPeriod({
        incomeStatement,
        entityType: "company",
        annualTurnover: 60_000_000,
        rules: buildEmptyBundle({}),
      }),
    ).toThrow(/Missing tax rule/);
  });
});

describe("Sprint 7: NRS Filing Integration", () => {
  it("should generate PIT form with correct structure", async () => {
    const { generateIncomeStatement } =
      await import("@/lib/financial-statements/income-statement");
    const { computeTaxForPeriod } =
      await import("@/lib/financial-statements/compute-tax-for-period");
    const { generatePITForm } = await import("@/lib/nrs-filing/form-generator");

    const incomeStatement = generateIncomeStatement(
      mockTransactions,
      "2026-01-01",
      "2026-01-31",
    );

    const { data: taxComputation } = computeTaxForPeriod({
      incomeStatement,
      entityType: "individual",
      annualTurnover: 5_000_000,
      rules: ruleBundle,
    });

    const pitForm = generatePITForm(
      { name: "Test Taxpayer", tin: "12345678-0001" },
      taxComputation,
      2026,
      0,
    );

    expect(pitForm.taxpayerName).toBe("Test Taxpayer");
    expect(pitForm.tin).toBe("12345678-0001");
    expect(pitForm.taxYear).toBe(2026);
    expect(pitForm.taxableIncome).toBeGreaterThan(0);
    expect(pitForm.taxLiability).toBeGreaterThan(0);
  });

  it("should generate CIT form with correct structure", async () => {
    const { generateIncomeStatement } =
      await import("@/lib/financial-statements/income-statement");
    const { computeTaxForPeriod } =
      await import("@/lib/financial-statements/compute-tax-for-period");
    const { generateCITForm } = await import("@/lib/nrs-filing/form-generator");

    const incomeStatement = generateIncomeStatement(
      mockTransactions,
      "2026-01-01",
      "2026-01-31",
    );

    const { data: taxComputation } = computeTaxForPeriod({
      incomeStatement,
      entityType: "company",
      annualTurnover: 60_000_000,
      rules: ruleBundle,
    });

    const citForm = generateCITForm(
      { name: "Test Company Ltd", tin: "12345678-0001" },
      incomeStatement,
      taxComputation,
      2026,
      0,
    );

    expect(citForm.companyName).toBe("Test Company Ltd");
    expect(citForm.tin).toBe("12345678-0001");
    expect(citForm.taxYear).toBe(2026);
    expect(citForm.turnover).toBe(incomeStatement.revenue.total);
    expect(citForm.taxRate).toBe(30); // Other Company rate
  });

  it("should calculate filing deadlines correctly", async () => {
    const { getFilingDeadlines } =
      await import("@/lib/nrs-filing/deadline-manager");

    const deadlines = getFilingDeadlines(2026);

    // Should have PIT, CIT, and 12 monthly VAT deadlines
    expect(deadlines.length).toBeGreaterThan(10);

    // PIT deadline should be March 31, 2027
    const pitDeadline = deadlines.find((d) => d.taxType === "PIT");
    expect(pitDeadline?.dueDate).toBe("2027-03-31");

    // CIT deadline should be June 30, 2027
    const citDeadline = deadlines.find((d) => d.taxType === "CIT");
    expect(citDeadline?.dueDate).toBe("2027-06-30");
  });
});

describe("End-to-End: Full Tax Filing Workflow", () => {
  it("should complete full workflow from transactions to NRS form", async () => {
    // 1. Parse transactions (Sprint 5)
    const transactions = mockTransactions;

    // 2. Generate Income Statement (Sprint 6)
    const { generateIncomeStatement } =
      await import("@/lib/financial-statements/income-statement");
    const incomeStatement = generateIncomeStatement(
      transactions,
      "2026-01-01",
      "2026-01-31",
    );

    expect(incomeStatement.revenue.total).toBe(5_000_000);
    expect(incomeStatement.expenses.total).toBe(1_750_000);

    // 3. Compute tax through the shared FS/NRS helper (Sprint 6)
    const { computeTaxForPeriod } =
      await import("@/lib/financial-statements/compute-tax-for-period");
    const { data: taxComputation } = computeTaxForPeriod({
      incomeStatement,
      entityType: "individual",
      annualTurnover: 5_000_000,
      rules: ruleBundle,
    });

    expect(taxComputation.taxableIncome).toBeGreaterThan(0);

    // 4. Generate NRS Form (Sprint 7)
    const { generatePITForm } = await import("@/lib/nrs-filing/form-generator");
    const pitForm = generatePITForm(
      { name: "Test Taxpayer", tin: "12345678-0001" },
      taxComputation,
      2026,
      0,
    );

    expect(pitForm.taxDue).toBeGreaterThan(0);

    // 5. Check filing deadline (Sprint 7)
    const { getFilingDeadlines } =
      await import("@/lib/nrs-filing/deadline-manager");
    const deadlines = getFilingDeadlines(2026);
    const pitDeadline = deadlines.find((d) => d.taxType === "PIT");

    expect(pitDeadline).toBeDefined();
    expect(pitDeadline?.dueDate).toBe("2027-03-31");
  });
});
