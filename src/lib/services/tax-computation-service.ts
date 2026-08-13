/**
 * Tax Computation Service
 * Implements Nigeria Tax Act 2025 tax calculations.
 * Effective Date: January 1, 2026
 *
 * Every rate, threshold, and band used here is loaded from a `RuleBundle`
 * via `requireRule` — nothing is hardcoded. If a required rule is missing
 * from the bundle, `requireRule` throws `MissingTaxRuleError` rather than
 * falling back to a default. See docs/TAX_RULE_PROVENANCE.md.
 */
import { MissingTaxRuleError } from "@/lib/tax/errors";
import { getRulesByType, requireRule } from "@/lib/tax/rule-loader";
import type { RuleBundle } from "@/lib/tax/types";

export interface TaxComputationInput {
  // Business Information
  businessType:
    | "individual"
    | "small_company"
    | "other_company"
    | "very_large_company";
  turnover: number;
  totalAssets: number;
  isProfessionalService: boolean;

  // Financial Data
  totalRevenue: number;
  totalExpenses: number;
  capitalGains: number;
  capitalLosses: number;
  nonDeductibleExpenses: number;

  // Individual-specific
  annualIncome?: number;
  rentPaid?: number;
  ownerOccupierInterest?: number;
}

export interface TaxComputationResult {
  // Classification
  businessClassification: string;
  qualifiesAsSmallCompany: boolean;

  // Income Calculation
  grossIncome: number;
  deductibleExpenses: number;
  assessableProfit: number;
  taxableIncome: number;

  // Tax Computation
  incomeTax: number;
  developmentLevy: number;
  totalTaxLiability: number;
  effectiveTaxRate: number;

  // Breakdown
  taxBreakdown: TaxBreakdownItem[];

  // Reliefs & Exemptions
  reliefs: ReliefItem[];
  exemptions: ExemptionItem[];

  // Compliance
  filingRequirements: string[];
  nextSteps: string[];
}

interface TaxBreakdownItem {
  description: string;
  amount: number;
  rate?: number;
}

interface ReliefItem {
  name: string;
  amount: number;
  description: string;
}

interface ExemptionItem {
  name: string;
  description: string;
}

export class TaxComputationService {
  /**
   * Compute tax liability based on Nigeria Tax Act 2025.
   *
   * `rules` must already be loaded (see src/lib/tax/rule-loader.ts). This
   * method is synchronous — all async rule loading happens before calling it.
   */
  static computeTax(
    input: TaxComputationInput,
    rules: RuleBundle,
  ): TaxComputationResult {
    const classification = this.classifyBusiness(input, rules);
    const qualifiesAsSmall = classification === "Small Company";

    const assessableProfit = this.calculateAssessableProfit(input, rules);
    const taxableIncome = this.calculateTaxableIncome(input, assessableProfit);

    const incomeTax = this.calculateIncomeTax(
      input,
      taxableIncome,
      qualifiesAsSmall,
      rules,
    );

    const developmentLevy = this.calculateDevelopmentLevy(
      input,
      assessableProfit,
      qualifiesAsSmall,
      rules,
    );

    const totalTaxLiability = incomeTax + developmentLevy;

    const effectiveTaxRate =
      input.totalRevenue > 0
        ? (totalTaxLiability / input.totalRevenue) * 100
        : 0;

    const taxBreakdown = this.generateTaxBreakdown(
      input,
      assessableProfit,
      taxableIncome,
      incomeTax,
      developmentLevy,
      rules,
    );

    const reliefs = this.identifyReliefs(input, rules);
    const exemptions = this.identifyExemptions(input, qualifiesAsSmall, rules);

    const filingRequirements = this.getFilingRequirements(
      input,
      qualifiesAsSmall,
      rules,
    );
    const nextSteps = this.getNextSteps(input, qualifiesAsSmall, rules);

    return {
      businessClassification: classification,
      qualifiesAsSmallCompany: qualifiesAsSmall,
      grossIncome: input.totalRevenue,
      deductibleExpenses: input.totalExpenses - input.nonDeductibleExpenses,
      assessableProfit,
      taxableIncome,
      incomeTax,
      developmentLevy,
      totalTaxLiability,
      effectiveTaxRate,
      taxBreakdown,
      reliefs,
      exemptions,
      filingRequirements,
      nextSteps,
    };
  }

  /**
   * Classify a company's tax category from turnover/assets alone, without
   * requiring an `Individual Taxpayer` vs `company` distinction. Exposed as
   * a public helper so callers building a `TaxComputationInput` (e.g. the
   * financial-statements/NRS-filing shared helper) can pre-set
   * `businessType` consistently with what `computeTax` will independently
   * derive, instead of guessing.
   *
   * The "very large company" threshold and minimum ETR rate are sourced
   * from `business_tax.very_large_turnover_threshold` /
   * `business_tax.minimum_etr` — as of PR 3a these are only seeded as
   * unverified candidates (see supabase/migrations/20260805140000_...sql),
   * so the rule loader fills them in from the unverified rule_version when
   * the active version has no verified figure.
   */
  static classifyBusinessType(
    turnover: number,
    totalAssets: number,
    isProfessionalService: boolean,
    rules: RuleBundle,
  ): "small_company" | "other_company" | "very_large_company" {
    const turnoverThreshold = requireRule(
      rules,
      "business_tax",
      "small_company_turnover_threshold",
    ).value.value as number;
    const assetsThreshold = requireRule(
      rules,
      "business_tax",
      "small_company_assets_threshold",
    ).value.value as number;

    if (
      turnover <= turnoverThreshold &&
      totalAssets <= assetsThreshold &&
      !isProfessionalService
    ) {
      return "small_company";
    }

    const veryLargeThreshold = requireRule(
      rules,
      "business_tax",
      "very_large_turnover_threshold",
    ).value.threshold as number;

    if (turnover >= veryLargeThreshold) {
      return "very_large_company";
    }

    return "other_company";
  }

  /**
   * Classify business based on Nigeria Tax Act 2025 (display string).
   */
  private static classifyBusiness(
    input: TaxComputationInput,
    rules: RuleBundle,
  ): string {
    if (input.businessType === "individual") {
      return "Individual Taxpayer";
    }

    const category = this.classifyBusinessType(
      input.turnover,
      input.totalAssets,
      input.isProfessionalService,
      rules,
    );

    if (category === "small_company") {
      return "Small Company";
    }

    if (category === "very_large_company") {
      const minEtr = requireRule(rules, "business_tax", "minimum_etr").value
        .rate as number;
      return `Very Large Company (Minimum ETR ${minEtr}%)`;
    }

    return "Other Company";
  }

  /**
   * Calculate assessable profit. Nigeria Tax Act 2025 integrates capital
   * gains into income tax (no separate CGT) — this is confirmed by the
   * business_tax.capital_gains_integration rule, which is required here so
   * that assumption is never silently applied without a backing rule.
   */
  private static calculateAssessableProfit(
    input: TaxComputationInput,
    rules: RuleBundle,
  ): number {
    requireRule(rules, "business_tax", "capital_gains_integration");

    const netProfit = input.totalRevenue - input.totalExpenses;
    const capitalGainsNet = input.capitalGains - input.capitalLosses;

    return netProfit + capitalGainsNet;
  }

  /**
   * Calculate taxable income (excludes non-deductible expenses)
   */
  private static calculateTaxableIncome(
    input: TaxComputationInput,
    assessableProfit: number,
  ): number {
    return assessableProfit + input.nonDeductibleExpenses;
  }

  /**
   * Calculate income tax
   */
  private static calculateIncomeTax(
    input: TaxComputationInput,
    taxableIncome: number,
    qualifiesAsSmall: boolean,
    rules: RuleBundle,
  ): number {
    if (input.businessType === "individual" && input.annualIncome) {
      return this.calculateIndividualTax(input.annualIncome, input, rules);
    }

    if (qualifiesAsSmall) {
      const rate =
        (requireRule(rules, "business_tax", "corporate_tax_rate_small").value
          .rate as number) / 100;
      return taxableIncome * rate;
    }

    if (input.businessType === "very_large_company") {
      const standardRate =
        (requireRule(rules, "business_tax", "corporate_tax_rate_other").value
          .rate as number) / 100;
      const minimumEtrRate =
        (requireRule(rules, "business_tax", "minimum_etr").value
          .rate as number) / 100;
      const standardTax = taxableIncome * standardRate;
      const minimumTax = input.totalRevenue * minimumEtrRate;
      return Math.max(standardTax, minimumTax);
    }

    const rate =
      (requireRule(rules, "business_tax", "corporate_tax_rate_other").value
        .rate as number) / 100;
    return taxableIncome * rate;
  }

  /**
   * Calculate individual income tax (Nigeria Tax Act 2025).
   *
   * Progressive tax bands are loaded dynamically from every
   * `individual_income_tax.tax_bracket_*` rule rather than hardcoded, so
   * a future band change only requires a rule_versions update.
   */
  private static calculateIndividualTax(
    annualIncome: number,
    input: TaxComputationInput,
    rules: RuleBundle,
  ): number {
    let taxableIncome = annualIncome;

    if (input.rentPaid) {
      const rentReliefRule = requireRule(
        rules,
        "individual_income_tax",
        "rent_relief",
      );
      const cap = rentReliefRule.value.cap as number;
      const percentage = rentReliefRule.value.percentage as number;
      const rentRelief = Math.min(cap, input.rentPaid * (percentage / 100));
      taxableIncome -= rentRelief;
    }

    if (input.ownerOccupierInterest) {
      // Confirms the deduction is a verified rule before applying it.
      requireRule(rules, "individual_income_tax", "owner_occupier_interest");
      taxableIncome -= input.ownerOccupierInterest;
    }

    taxableIncome = Math.max(0, taxableIncome);

    const brackets = getRulesByType(rules, "individual_income_tax")
      .filter((rule) => rule.ruleKey.startsWith("tax_bracket_"))
      .sort(
        (a, b) => (a.value.from as number) - (b.value.from as number),
      );

    if (brackets.length === 0) {
      throw new MissingTaxRuleError(
        "individual_income_tax",
        "tax_bracket_1",
        "no individual income tax bracket schedule is loaded",
      );
    }

    let tax = 0;
    let lowerBound = 0;

    for (const bracket of brackets) {
      const upperBound = (bracket.value.to as number | null) ?? Infinity;
      const amountInBand = Math.max(
        0,
        Math.min(taxableIncome, upperBound) - lowerBound,
      );
      tax += amountInBand * ((bracket.value.rate as number) / 100);
      lowerBound = upperBound;

      if (taxableIncome <= upperBound) {
        break;
      }
    }

    return tax;
  }

  /**
   * Calculate development levy. Exemption list is loaded from
   * business_tax.development_levy_exemptions rather than assumed.
   */
  private static calculateDevelopmentLevy(
    input: TaxComputationInput,
    assessableProfit: number,
    qualifiesAsSmall: boolean,
    rules: RuleBundle,
  ): number {
    const exemptCategories = requireRule(
      rules,
      "business_tax",
      "development_levy_exemptions",
    ).value.exempt as string[];

    const isSmallCompanyExempt =
      qualifiesAsSmall && exemptCategories.includes("small_company");

    if (isSmallCompanyExempt || input.businessType === "individual") {
      return 0;
    }

    const rate =
      (requireRule(rules, "business_tax", "development_levy_rate").value
        .rate as number) / 100;

    return assessableProfit * rate;
  }

  /**
   * Generate tax breakdown
   */
  private static generateTaxBreakdown(
    input: TaxComputationInput,
    assessableProfit: number,
    taxableIncome: number,
    incomeTax: number,
    developmentLevy: number,
    rules: RuleBundle,
  ): TaxBreakdownItem[] {
    const breakdown: TaxBreakdownItem[] = [];

    breakdown.push({
      description: "Total Revenue",
      amount: input.totalRevenue,
    });

    breakdown.push({
      description: "Less: Deductible Expenses",
      amount: -(input.totalExpenses - input.nonDeductibleExpenses),
    });

    if (input.capitalGains > 0) {
      breakdown.push({
        description: "Add: Capital Gains",
        amount: input.capitalGains,
      });
    }

    if (input.capitalLosses > 0) {
      breakdown.push({
        description: "Less: Capital Losses",
        amount: -input.capitalLosses,
      });
    }

    breakdown.push({
      description: "Assessable Profit",
      amount: assessableProfit,
    });

    if (input.nonDeductibleExpenses > 0) {
      breakdown.push({
        description: "Add: Non-Deductible Expenses",
        amount: input.nonDeductibleExpenses,
      });
    }

    breakdown.push({
      description: "Taxable Income",
      amount: taxableIncome,
    });

    let incomeTaxRate: number | undefined;
    if (input.businessType === "other_company") {
      incomeTaxRate = requireRule(rules, "business_tax", "corporate_tax_rate_other")
        .value.rate as number;
    } else if (input.businessType === "very_large_company") {
      incomeTaxRate = requireRule(rules, "business_tax", "minimum_etr").value
        .rate as number;
    }

    breakdown.push({
      description: "Income Tax",
      amount: incomeTax,
      rate: incomeTaxRate,
    });

    if (developmentLevy > 0) {
      const levyRate = requireRule(rules, "business_tax", "development_levy_rate")
        .value.rate as number;
      breakdown.push({
        description: "Development Levy",
        amount: developmentLevy,
        rate: levyRate,
      });
    }

    return breakdown;
  }

  /**
   * Identify applicable reliefs
   */
  private static identifyReliefs(
    input: TaxComputationInput,
    rules: RuleBundle,
  ): ReliefItem[] {
    const reliefs: ReliefItem[] = [];

    if (input.businessType === "individual") {
      if (input.rentPaid) {
        const rentReliefRule = requireRule(
          rules,
          "individual_income_tax",
          "rent_relief",
        );
        const cap = rentReliefRule.value.cap as number;
        const percentage = rentReliefRule.value.percentage as number;
        const rentRelief = Math.min(cap, input.rentPaid * (percentage / 100));
        reliefs.push({
          name: "Rent Relief",
          amount: rentRelief,
          description: `₦${cap.toLocaleString()} or ${percentage}% of annual rent paid (whichever is lower)`,
        });
      }

      if (input.ownerOccupierInterest) {
        requireRule(rules, "individual_income_tax", "owner_occupier_interest");
        reliefs.push({
          name: "Owner-Occupier Interest",
          amount: input.ownerOccupierInterest,
          description: "Interest on owner-occupier house is deductible",
        });
      }
    }

    return reliefs;
  }

  /**
   * Identify applicable exemptions.
   *
   * Deliberately does NOT assert VAT exemption/registration status here —
   * the VAT registration/small-business-exemption turnover threshold has
   * three mutually exclusive unverified candidate readings (see
   * src/lib/tax/rule-loader.ts#resolveVatObligationStatus). Use the VAT
   * calculator / VATService.getRegistrationObligation for that question.
   */
  private static identifyExemptions(
    input: TaxComputationInput,
    qualifiesAsSmall: boolean,
    rules: RuleBundle,
  ): ExemptionItem[] {
    const exemptions: ExemptionItem[] = [];

    if (qualifiesAsSmall) {
      const smallRate = requireRule(rules, "business_tax", "corporate_tax_rate_small")
        .value.rate as number;
      const turnoverThreshold = requireRule(
        rules,
        "business_tax",
        "small_company_turnover_threshold",
      ).value.value as number;
      const assetsThreshold = requireRule(
        rules,
        "business_tax",
        "small_company_assets_threshold",
      ).value.value as number;

      exemptions.push({
        name: "Small Company Income Tax Exemption",
        description: `${smallRate}% income tax rate (turnover ≤ ₦${(turnoverThreshold / 1_000_000).toLocaleString()}m, assets ≤ ₦${(assetsThreshold / 1_000_000).toLocaleString()}m)`,
      });

      exemptions.push({
        name: "Development Levy Exemption",
        description: "Small companies are exempt from development levy",
      });

      const cgtRule = requireRule(rules, "business_tax", "capital_gains_integration");
      if (cgtRule.value.integrated) {
        exemptions.push({
          name: "Capital Gains Tax Exemption",
          description: `${smallRate}% capital gains tax (integrated into income tax)`,
        });
      }
    }

    if (
      input.businessType === "individual" &&
      input.annualIncome !== undefined
    ) {
      const firstBracket = requireRule(
        rules,
        "individual_income_tax",
        "tax_bracket_1",
      );
      const taxFreeThreshold = firstBracket.value.to as number;
      if (input.annualIncome <= taxFreeThreshold) {
        exemptions.push({
          name: "Individual Tax-Free Threshold",
          description: `First ₦${taxFreeThreshold.toLocaleString()} of annual income is tax-free`,
        });
      }
    }

    return exemptions;
  }

  /**
   * Get filing requirements
   */
  private static getFilingRequirements(
    input: TaxComputationInput,
    qualifiesAsSmall: boolean,
    rules: RuleBundle,
  ): string[] {
    const requirements: string[] = [];

    if (input.businessType === "individual") {
      requirements.push("File annual personal income tax return");
      requirements.push(
        "Submit employer tax deduction certificate (if employed)",
      );
    } else {
      requirements.push("File annual corporate income tax return");
      requirements.push("Submit audited financial statements");
      requirements.push("File VAT returns (monthly)");

      if (!qualifiesAsSmall) {
        const levyRate = requireRule(rules, "business_tax", "development_levy_rate")
          .value.rate as number;
        requirements.push(
          `Pay development levy (${levyRate}% of assessable profits)`,
        );
      }

      if (input.businessType === "very_large_company") {
        const minEtr = requireRule(rules, "business_tax", "minimum_etr").value
          .rate as number;
        requirements.push(`Maintain ${minEtr}% minimum effective tax rate`);
        requirements.push("Submit transfer pricing documentation");
      }
    }

    requirements.push("Register with Nigeria Revenue Service (NRS)");
    requirements.push("Obtain Tax Identification Number (TIN)");

    return requirements;
  }

  /**
   * Get next steps
   */
  private static getNextSteps(
    input: TaxComputationInput,
    qualifiesAsSmall: boolean,
    rules: RuleBundle,
  ): string[] {
    const steps: string[] = [];

    if (qualifiesAsSmall) {
      const smallRate = requireRule(rules, "business_tax", "corporate_tax_rate_small")
        .value.rate as number;
      steps.push("Confirm eligibility for small company status with NRS");
      steps.push(
        `Enjoy ${smallRate}% income tax rate and development levy exemption`,
      );
      steps.push(
        "VAT registration/exemption threshold is unresolved for your turnover — verify manually via the VAT calculator before assuming exemption (see review_queue)",
      );
    } else {
      const otherRate = requireRule(rules, "business_tax", "corporate_tax_rate_other")
        .value.rate as number;
      const levyRate = requireRule(rules, "business_tax", "development_levy_rate")
        .value.rate as number;
      steps.push(`Prepare for ${otherRate}% corporate income tax payment`);
      steps.push(`Budget for ${levyRate}% development levy`);
      steps.push(
        "Ensure all VAT and customs duties are paid for expense deductibility",
      );
    }

    steps.push("Maintain proper accounting records");
    steps.push(
      "Consult a qualified Nigerian tax professional for complex matters",
    );

    return steps;
  }

  /**
   * Format currency for Nigerian Naira
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
