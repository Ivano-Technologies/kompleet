import { describe, expect, it } from "vitest";
import { TaxComputationService, type TaxComputationInput } from "./tax-computation-service";
import { MissingTaxRuleError } from "@/lib/tax/errors";
import {
  buildMockRuleBundle,
  type MockRuleSeed,
} from "../../../tests/helpers/mock-rule-bundle";

const individualRulesWithoutCgt = buildMockRuleBundle({
  business_tax: {
    corporate_tax_rate_other: { value: { rate: 30 } },
    development_levy_rate: { value: { rate: 4 } },
    development_levy_exemptions: {
      value: { exempt: ["small_company", "non_resident_company"] },
    },
  },
  individual_income_tax: {
    tax_bracket_1: { value: { from: 0, to: 800_000, rate: 0 } },
    tax_bracket_2: { value: { from: 800_001, to: 3_000_000, rate: 15 } },
    tax_bracket_3: { value: { from: 3_000_001, to: 12_000_000, rate: 18 } },
  },
});

const smallCompanyRulesWithoutCgt = buildMockRuleBundle({
  business_tax: {
    small_company_turnover_threshold: { value: { value: 50_000_000 } },
    small_company_assets_threshold: { value: { value: 250_000_000 } },
    corporate_tax_rate_small: { value: { rate: 0 } },
    development_levy_exemptions: {
      value: { exempt: ["small_company", "non_resident_company"] },
    },
  },
});

const individualRulesWithCgt = buildMockRuleBundle({
  business_tax: {
    corporate_tax_rate_other: { value: { rate: 30 } },
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
  },
});

function individualInput(
  overrides: Partial<TaxComputationInput> = {},
): TaxComputationInput {
  return {
    businessType: "individual",
    turnover: 5_000_000,
    totalAssets: 0,
    isProfessionalService: false,
    totalRevenue: 5_000_000,
    totalExpenses: 1_750_000,
    capitalGains: 0,
    capitalLosses: 0,
    nonDeductibleExpenses: 0,
    annualIncome: 3_250_000,
    ...overrides,
  };
}

describe("TaxComputationService capital gains integration", () => {
  it("does not require capital_gains_integration when gains and losses are zero", () => {
    const result = TaxComputationService.computeTax(
      individualInput(),
      individualRulesWithoutCgt,
    );
    expect(result.assessableProfit).toBe(3_250_000);
    expect(result.exemptions.some((item) => item.name.includes("Capital Gains"))).toBe(
      false,
    );
  });

  it("does not require capital_gains_integration for a small company with zero gains and losses", () => {
    const result = TaxComputationService.computeTax(
      {
        businessType: "small_company",
        turnover: 20_000_000,
        totalAssets: 10_000_000,
        isProfessionalService: false,
        totalRevenue: 5_000_000,
        totalExpenses: 1_750_000,
        capitalGains: 0,
        capitalLosses: 0,
        nonDeductibleExpenses: 0,
      },
      smallCompanyRulesWithoutCgt,
    );
    expect(result.qualifiesAsSmallCompany).toBe(true);
    expect(result.assessableProfit).toBe(3_250_000);
    expect(result.exemptions.map((item) => item.name)).not.toContain(
      "Capital Gains Tax Exemption",
    );
  });

  it("throws MissingTaxRuleError when capital gains are non-zero and the rule is absent", () => {
    expect(() =>
      TaxComputationService.computeTax(
        individualInput({ capitalGains: 100_000 }),
        individualRulesWithoutCgt,
      ),
    ).toThrow(MissingTaxRuleError);
    expect(() =>
      TaxComputationService.computeTax(
        individualInput({ capitalGains: 100_000 }),
        individualRulesWithoutCgt,
      ),
    ).toThrow(/business_tax\.capital_gains_integration/);
  });

  it("throws MissingTaxRuleError when capital losses are non-zero and the rule is absent", () => {
    expect(() =>
      TaxComputationService.computeTax(
        individualInput({ capitalLosses: 50_000 }),
        individualRulesWithoutCgt,
      ),
    ).toThrow(MissingTaxRuleError);
  });

  it("includes net capital gains in assessable profit when the integration rule is present", () => {
    const result = TaxComputationService.computeTax(
      individualInput({ capitalGains: 200_000, capitalLosses: 50_000 }),
      individualRulesWithCgt,
    );
    expect(result.assessableProfit).toBe(3_400_000);
  });
});

function companyRules(
  businessOverrides: Record<string, MockRuleSeed> = {},
  bundleOptions?: { activeVersionId?: string | null; unverifiedVersionId?: string | null },
) {
  return buildMockRuleBundle(
    {
      business_tax: {
        small_company_turnover_threshold: { value: { value: 50_000_000 } },
        small_company_assets_threshold: { value: { value: 250_000_000 } },
        corporate_tax_rate_small: { value: { rate: 0 } },
        corporate_tax_rate_other: { value: { rate: 30 } },
        minimum_etr: { value: { rate: 15 } },
        very_large_turnover_threshold: { value: { threshold: 20_000_000_000 } },
        development_levy_rate: { value: { rate: 4 } },
        development_levy_exemptions: {
          value: { exempt: ["small_company", "non_resident_company"] },
        },
        ...businessOverrides,
      },
    },
    bundleOptions,
  );
}

function veryLargeInput(
  overrides: Partial<TaxComputationInput> = {},
): TaxComputationInput {
  return {
    businessType: "very_large_company",
    turnover: 25_000_000_000,
    totalAssets: 1_000_000_000,
    isProfessionalService: false,
    totalRevenue: 10_000_000_000,
    totalExpenses: 8_000_000_000,
    capitalGains: 0,
    capitalLosses: 0,
    nonDeductibleExpenses: 0,
    ...overrides,
  };
}

describe("TaxComputationService minimum ETR", () => {
  it("does not top up when CIT plus development levy is already at or above 15% of PBT", () => {
    const pbt = 2_000_000_000;
    const result = TaxComputationService.computeTax(
      veryLargeInput({
        totalRevenue: 10_000_000_000,
        totalExpenses: 8_000_000_000,
      }),
      companyRules(),
    );

    expect(result.assessableProfit).toBe(pbt);
    const cit = pbt * 0.3;
    const levy = pbt * 0.04;
    expect(result.incomeTax).toBe(cit);
    expect(result.developmentLevy).toBe(levy);
    expect(cit + levy).toBeGreaterThanOrEqual(0.15 * pbt);
    expect(result.minimumEtrTopUp).toBe(0);
    expect(result.totalTaxLiability).toBe(cit + levy);
    // Must not charge 15% of revenue (the previous formula).
    expect(result.incomeTax).toBeLessThan(0.15 * 10_000_000_000);
  });

  it("adds a positive top-up when CIT plus levy is below 15% of PBT", () => {
    const pbt = 2_000_000_000;
    const result = TaxComputationService.computeTax(
      veryLargeInput({
        totalRevenue: 10_000_000_000,
        totalExpenses: 8_000_000_000,
      }),
      companyRules({
        corporate_tax_rate_other: { value: { rate: 5 } },
      }),
    );

    const cit = pbt * 0.05;
    const levy = pbt * 0.04;
    const floor = pbt * 0.15;
    expect(result.incomeTax).toBe(cit);
    expect(result.developmentLevy).toBe(levy);
    expect(cit + levy).toBeLessThan(floor);
    expect(result.minimumEtrTopUp).toBe(floor - cit - levy);
    expect(result.totalTaxLiability).toBe(floor);
    expect(
      result.taxBreakdown.some(
        (item) => item.description === "Minimum ETR top-up" && item.amount > 0,
      ),
    ).toBe(true);
  });

  it("returns zero top-up when PBT is zero or negative", () => {
    const zeroProfit = TaxComputationService.computeTax(
      veryLargeInput({
        totalRevenue: 10_000_000_000,
        totalExpenses: 10_000_000_000,
      }),
      companyRules({
        corporate_tax_rate_other: { value: { rate: 5 } },
      }),
    );
    expect(zeroProfit.assessableProfit).toBe(0);
    expect(zeroProfit.minimumEtrTopUp).toBe(0);

    const loss = TaxComputationService.computeTax(
      veryLargeInput({
        totalRevenue: 10_000_000_000,
        totalExpenses: 12_000_000_000,
      }),
      companyRules({
        corporate_tax_rate_other: { value: { rate: 5 } },
      }),
    );
    expect(loss.assessableProfit).toBeLessThan(0);
    expect(loss.minimumEtrTopUp).toBe(0);
  });

  it("does not apply the minimum ETR to a small company", () => {
    const result = TaxComputationService.computeTax(
      {
        businessType: "small_company",
        turnover: 20_000_000,
        totalAssets: 10_000_000,
        isProfessionalService: false,
        totalRevenue: 5_000_000,
        totalExpenses: 1_750_000,
        capitalGains: 0,
        capitalLosses: 0,
        nonDeductibleExpenses: 0,
      },
      companyRules(),
    );

    expect(result.qualifiesAsSmallCompany).toBe(true);
    expect(result.incomeTax).toBe(0);
    expect(result.developmentLevy).toBe(0);
    expect(result.minimumEtrTopUp).toBe(0);
    expect(result.unverifiedRuleKeys).toEqual([]);
  });
});

describe("TaxComputationService unverified rule warning", () => {
  it("lists used rules marked unverified", () => {
    const result = TaxComputationService.computeTax(
      veryLargeInput(),
      companyRules({
        minimum_etr: {
          value: { rate: 15 },
          confidenceLevel: "unverified",
        },
        very_large_turnover_threshold: {
          value: { threshold: 20_000_000_000 },
          confidenceLevel: "unverified",
        },
      }),
    );

    expect(result.unverifiedRuleKeys).toEqual([
      "business_tax.minimum_etr",
      "business_tax.very_large_turnover_threshold",
    ]);
  });

  it("lists used rules loaded from a non-active unverified version", () => {
    const result = TaxComputationService.computeTax(
      veryLargeInput(),
      companyRules(
        {
          minimum_etr: {
            value: { rate: 15 },
            confidenceLevel: "high",
            ruleVersionId: "unverified-candidates",
          },
        },
        {
          activeVersionId: "test-active-version",
          unverifiedVersionId: "unverified-candidates",
        },
      ),
    );

    expect(result.unverifiedRuleKeys).toContain("business_tax.minimum_etr");
    expect(result.unverifiedRuleKeys).not.toContain(
      "business_tax.corporate_tax_rate_other",
    );
  });

  it("does not list unused unverified rules sitting in the bundle", () => {
    const result = TaxComputationService.computeTax(
      {
        businessType: "small_company",
        turnover: 20_000_000,
        totalAssets: 10_000_000,
        isProfessionalService: false,
        totalRevenue: 5_000_000,
        totalExpenses: 1_750_000,
        capitalGains: 0,
        capitalLosses: 0,
        nonDeductibleExpenses: 0,
      },
      companyRules({
        minimum_etr: {
          value: { rate: 15 },
          confidenceLevel: "unverified",
        },
        very_large_turnover_threshold: {
          value: { threshold: 20_000_000_000 },
          confidenceLevel: "unverified",
        },
      }),
    );

    expect(result.unverifiedRuleKeys).toEqual([]);
  });
});

describe("TaxComputationService individual zero income", () => {
  it("keeps PIT with ₦0 income on the individual path instead of company tax", () => {
    const result = TaxComputationService.computeTax(
      individualInput({ annualIncome: 0 }),
      individualRulesWithoutCgt,
    );

    expect(result.businessClassification).toBe("Individual Taxpayer");
    expect(result.incomeTax).toBe(0);
    expect(result.developmentLevy).toBe(0);
    expect(result.minimumEtrTopUp).toBe(0);
    // Profit on the books would have produced 30% CIT if this fell through.
    expect(result.assessableProfit).toBe(3_250_000);
    expect(result.exemptions.map((item) => item.name)).toContain(
      "Individual Tax-Free Threshold",
    );
  });
});
