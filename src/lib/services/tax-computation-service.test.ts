import { describe, expect, it } from "vitest";
import { TaxComputationService, type TaxComputationInput } from "./tax-computation-service";
import { MissingTaxRuleError } from "@/lib/tax/errors";
import { buildMockRuleBundle } from "../../../tests/helpers/mock-rule-bundle";

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
