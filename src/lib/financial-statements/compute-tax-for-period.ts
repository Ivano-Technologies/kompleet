/**
 * Shared Tax Computation Entry Point (Financial Statements / NRS Filing)
 * ========================================================================
 * Single function called by BOTH `/api/financial-statements/generate` and
 * `/api/nrs-filing/generate` so the tax figures produced for a given
 * income statement + entity type are guaranteed identical across both
 * paths. See tests/tax-computation-path-parity.test.ts.
 *
 * All actual rates/thresholds come from the `RuleBundle` passed in via
 * `TaxComputationService.computeTax` — this module only maps
 * `IncomeStatementData` + basic entity info into a `TaxComputationInput`.
 */
import type { IncomeStatementData } from "./income-statement";
import {
  TaxComputationService,
  type TaxComputationInput,
  type TaxComputationResult,
} from "@/lib/services/tax-computation-service";
import {
  toTaxComputationData,
  type TaxComputationData,
} from "./tax-computation-html";
import type { RuleBundle } from "@/lib/tax/types";

export interface ComputeTaxForPeriodParams {
  incomeStatement: IncomeStatementData;
  entityType: "individual" | "company";
  annualTurnover: number;
  rules: RuleBundle;
  totalAssets?: number;
  isProfessionalService?: boolean;
  capitalGains?: number;
  capitalLosses?: number;
  nonDeductibleExpenses?: number;
  /** Individual filers only. Defaults to the period's net profit if omitted. */
  annualIncome?: number;
  rentPaid?: number;
  ownerOccupierInterest?: number;
}

export interface ComputeTaxForPeriodOutcome {
  result: TaxComputationResult;
  data: TaxComputationData;
}

export function computeTaxForPeriod(
  params: ComputeTaxForPeriodParams,
): ComputeTaxForPeriodOutcome {
  const {
    incomeStatement,
    entityType,
    annualTurnover,
    rules,
    totalAssets = 0,
    isProfessionalService = false,
    capitalGains = 0,
    capitalLosses = 0,
    nonDeductibleExpenses = 0,
    annualIncome,
    rentPaid,
    ownerOccupierInterest,
  } = params;

  const businessType: TaxComputationInput["businessType"] =
    entityType === "individual"
      ? "individual"
      : TaxComputationService.classifyBusinessType(
          annualTurnover,
          totalAssets,
          isProfessionalService,
          rules,
        );

  const input: TaxComputationInput = {
    businessType,
    turnover: annualTurnover,
    totalAssets,
    isProfessionalService,
    totalRevenue: incomeStatement.revenue.total,
    totalExpenses: incomeStatement.expenses.total,
    capitalGains,
    capitalLosses,
    nonDeductibleExpenses,
    annualIncome:
      entityType === "individual"
        ? (annualIncome ?? incomeStatement.netProfit)
        : annualIncome,
    rentPaid,
    ownerOccupierInterest,
  };

  const result = TaxComputationService.computeTax(input, rules);
  const data = toTaxComputationData(result);

  return { result, data };
}
