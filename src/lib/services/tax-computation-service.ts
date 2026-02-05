/**
 * Tax Computation Service
 * Implements Nigeria Tax Act 2025 tax calculations
 * Effective Date: January 1, 2026
 */

export interface TaxComputationInput {
  // Business Information
  businessType: 'individual' | 'small_company' | 'other_company' | 'very_large_company';
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
   * Compute tax liability based on Nigeria Tax Act 2025
   */
  static computeTax(input: TaxComputationInput): TaxComputationResult {
    // Determine business classification
    const classification = this.classifyBusiness(input);
    const qualifiesAsSmall = classification === 'Small Company';

    // Calculate assessable profit
    const assessableProfit = this.calculateAssessableProfit(input);

    // Calculate taxable income
    const taxableIncome = this.calculateTaxableIncome(input, assessableProfit);

    // Calculate income tax
    const incomeTax = this.calculateIncomeTax(input, taxableIncome, qualifiesAsSmall);

    // Calculate development levy
    const developmentLevy = this.calculateDevelopmentLevy(
      input,
      assessableProfit,
      qualifiesAsSmall
    );

    // Total tax liability
    const totalTaxLiability = incomeTax + developmentLevy;

    // Effective tax rate
    const effectiveTaxRate =
      input.totalRevenue > 0 ? (totalTaxLiability / input.totalRevenue) * 100 : 0;

    // Tax breakdown
    const taxBreakdown = this.generateTaxBreakdown(
      input,
      assessableProfit,
      taxableIncome,
      incomeTax,
      developmentLevy
    );

    // Reliefs and exemptions
    const reliefs = this.identifyReliefs(input);
    const exemptions = this.identifyExemptions(input, qualifiesAsSmall);

    // Filing requirements
    const filingRequirements = this.getFilingRequirements(input, qualifiesAsSmall);
    const nextSteps = this.getNextSteps(input, qualifiesAsSmall);

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
   * Classify business based on Nigeria Tax Act 2025
   */
  private static classifyBusiness(input: TaxComputationInput): string {
    if (input.businessType === 'individual') {
      return 'Individual Taxpayer';
    }

    // Small Company criteria (both must be met)
    if (
      input.turnover <= 50_000_000 &&
      input.totalAssets <= 250_000_000 &&
      !input.isProfessionalService
    ) {
      return 'Small Company';
    }

    // Very Large Company
    if (input.turnover >= 20_000_000_000) {
      return 'Very Large Company (Minimum ETR 15%)';
    }

    return 'Other Company';
  }

  /**
   * Calculate assessable profit
   */
  private static calculateAssessableProfit(input: TaxComputationInput): number {
    const netProfit = input.totalRevenue - input.totalExpenses;
    const capitalGainsNet = input.capitalGains - input.capitalLosses;

    // Capital gains integrated into income tax
    return netProfit + capitalGainsNet;
  }

  /**
   * Calculate taxable income (excludes non-deductible expenses)
   */
  private static calculateTaxableIncome(
    input: TaxComputationInput,
    assessableProfit: number
  ): number {
    // Add back non-deductible expenses
    return assessableProfit + input.nonDeductibleExpenses;
  }

  /**
   * Calculate income tax
   */
  private static calculateIncomeTax(
    input: TaxComputationInput,
    taxableIncome: number,
    qualifiesAsSmall: boolean
  ): number {
    // Individual tax calculation
    if (input.businessType === 'individual' && input.annualIncome) {
      return this.calculateIndividualTax(input.annualIncome, input);
    }

    // Small company: 0% tax
    if (qualifiesAsSmall) {
      return 0;
    }

    // Other companies: 30% tax
    if (input.businessType === 'other_company') {
      return taxableIncome * 0.3;
    }

    // Very large companies: 30% with 15% minimum ETR
    if (input.businessType === 'very_large_company') {
      const standardTax = taxableIncome * 0.3;
      const minimumTax = input.totalRevenue * 0.15;
      return Math.max(standardTax, minimumTax);
    }

    return taxableIncome * 0.3;
  }

  /**
   * Calculate individual income tax (Nigeria Tax Act 2025)
   */
  private static calculateIndividualTax(
    annualIncome: number,
    input: TaxComputationInput
  ): number {
    // Apply reliefs
    let taxableIncome = annualIncome;

    // Rent relief: N500,000 OR 20% of rent (whichever is lower)
    if (input.rentPaid) {
      const rentRelief = Math.min(500_000, input.rentPaid * 0.2);
      taxableIncome -= rentRelief;
    }

    // Owner-occupier interest deduction
    if (input.ownerOccupierInterest) {
      taxableIncome -= input.ownerOccupierInterest;
    }

    // Progressive tax bands
    let tax = 0;
    let remaining = taxableIncome;

    // Band 1: First N800,000 @ 0%
    if (remaining > 800_000) {
      remaining -= 800_000;
    } else {
      return 0;
    }

    // Band 2: Next N2,200,000 @ 15%
    if (remaining > 2_200_000) {
      tax += 2_200_000 * 0.15;
      remaining -= 2_200_000;
    } else {
      tax += remaining * 0.15;
      return tax;
    }

    // Band 3: Next N9,000,000 @ 18%
    if (remaining > 9_000_000) {
      tax += 9_000_000 * 0.18;
      remaining -= 9_000_000;
    } else {
      tax += remaining * 0.18;
      return tax;
    }

    // Band 4: Next N13,000,000 @ 21%
    if (remaining > 13_000_000) {
      tax += 13_000_000 * 0.21;
      remaining -= 13_000_000;
    } else {
      tax += remaining * 0.21;
      return tax;
    }

    // Band 5: Next N25,000,000 @ 23%
    if (remaining > 25_000_000) {
      tax += 25_000_000 * 0.23;
      remaining -= 25_000_000;
    } else {
      tax += remaining * 0.23;
      return tax;
    }

    // Band 6: Above N50,000,000 @ 25%
    tax += remaining * 0.25;

    return tax;
  }

  /**
   * Calculate development levy (4% of assessable profits)
   */
  private static calculateDevelopmentLevy(
    input: TaxComputationInput,
    assessableProfit: number,
    qualifiesAsSmall: boolean
  ): number {
    // Exemptions: Small companies, individuals, non-residents
    if (qualifiesAsSmall || input.businessType === 'individual') {
      return 0;
    }

    return assessableProfit * 0.04;
  }

  /**
   * Generate tax breakdown
   */
  private static generateTaxBreakdown(
    input: TaxComputationInput,
    assessableProfit: number,
    taxableIncome: number,
    incomeTax: number,
    developmentLevy: number
  ): TaxBreakdownItem[] {
    const breakdown: TaxBreakdownItem[] = [];

    breakdown.push({
      description: 'Total Revenue',
      amount: input.totalRevenue,
    });

    breakdown.push({
      description: 'Less: Deductible Expenses',
      amount: -(input.totalExpenses - input.nonDeductibleExpenses),
    });

    if (input.capitalGains > 0) {
      breakdown.push({
        description: 'Add: Capital Gains',
        amount: input.capitalGains,
      });
    }

    if (input.capitalLosses > 0) {
      breakdown.push({
        description: 'Less: Capital Losses',
        amount: -input.capitalLosses,
      });
    }

    breakdown.push({
      description: 'Assessable Profit',
      amount: assessableProfit,
    });

    if (input.nonDeductibleExpenses > 0) {
      breakdown.push({
        description: 'Add: Non-Deductible Expenses',
        amount: input.nonDeductibleExpenses,
      });
    }

    breakdown.push({
      description: 'Taxable Income',
      amount: taxableIncome,
    });

    breakdown.push({
      description: 'Income Tax',
      amount: incomeTax,
      rate: input.businessType === 'other_company' ? 30 : undefined,
    });

    if (developmentLevy > 0) {
      breakdown.push({
        description: 'Development Levy',
        amount: developmentLevy,
        rate: 4,
      });
    }

    return breakdown;
  }

  /**
   * Identify applicable reliefs
   */
  private static identifyReliefs(input: TaxComputationInput): ReliefItem[] {
    const reliefs: ReliefItem[] = [];

    if (input.businessType === 'individual') {
      if (input.rentPaid) {
        const rentRelief = Math.min(500_000, input.rentPaid * 0.2);
        reliefs.push({
          name: 'Rent Relief',
          amount: rentRelief,
          description: 'N500,000 or 20% of annual rent paid (whichever is lower)',
        });
      }

      if (input.ownerOccupierInterest) {
        reliefs.push({
          name: 'Owner-Occupier Interest',
          amount: input.ownerOccupierInterest,
          description: 'Interest on owner-occupier house is deductible',
        });
      }
    }

    return reliefs;
  }

  /**
   * Identify applicable exemptions
   */
  private static identifyExemptions(
    input: TaxComputationInput,
    qualifiesAsSmall: boolean
  ): ExemptionItem[] {
    const exemptions: ExemptionItem[] = [];

    if (qualifiesAsSmall) {
      exemptions.push({
        name: 'Small Company Income Tax Exemption',
        description: '0% income tax rate (turnover ≤ N50m, assets ≤ N250m)',
      });

      exemptions.push({
        name: 'Development Levy Exemption',
        description: 'Small companies are exempt from 4% development levy',
      });

      exemptions.push({
        name: 'Capital Gains Tax Exemption',
        description: '0% capital gains tax (integrated into income tax)',
      });

      if (input.turnover < 100_000_000 && input.totalAssets < 250_000_000) {
        exemptions.push({
          name: 'VAT Exemption',
          description: 'Turnover < N100m AND assets < N250m',
        });
      }
    }

    if (input.businessType === 'individual' && input.annualIncome && input.annualIncome <= 800_000) {
      exemptions.push({
        name: 'Individual Tax-Free Threshold',
        description: 'First N800,000 of annual income is tax-free',
      });
    }

    return exemptions;
  }

  /**
   * Get filing requirements
   */
  private static getFilingRequirements(
    input: TaxComputationInput,
    qualifiesAsSmall: boolean
  ): string[] {
    const requirements: string[] = [];

    if (input.businessType === 'individual') {
      requirements.push('File annual personal income tax return');
      requirements.push('Submit employer tax deduction certificate (if employed)');
    } else {
      requirements.push('File annual corporate income tax return');
      requirements.push('Submit audited financial statements');
      requirements.push('File VAT returns (monthly)');

      if (!qualifiesAsSmall) {
        requirements.push('Pay development levy (4% of assessable profits)');
      }

      if (input.businessType === 'very_large_company') {
        requirements.push('Maintain 15% minimum effective tax rate');
        requirements.push('Submit transfer pricing documentation');
      }
    }

    requirements.push('Register with Nigeria Revenue Service (NRS)');
    requirements.push('Obtain Tax Identification Number (TIN)');

    return requirements;
  }

  /**
   * Get next steps
   */
  private static getNextSteps(
    input: TaxComputationInput,
    qualifiesAsSmall: boolean
  ): string[] {
    const steps: string[] = [];

    if (qualifiesAsSmall) {
      steps.push('Confirm eligibility for small company status with NRS');
      steps.push('Enjoy 0% income tax rate and development levy exemption');
      steps.push('Consider VAT exemption if turnover < N100m');
    } else {
      steps.push('Prepare for 30% corporate income tax payment');
      steps.push('Budget for 4% development levy');
      steps.push('Ensure all VAT and customs duties are paid for expense deductibility');
    }

    steps.push('Maintain proper accounting records');
    steps.push('Consult a qualified Nigerian tax professional for complex matters');

    return steps;
  }

  /**
   * Format currency for Nigerian Naira
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
