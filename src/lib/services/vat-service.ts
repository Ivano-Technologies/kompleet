/**
 * VAT (Value Added Tax) Service
 * Implements Nigeria VAT calculations per the Nigeria Tax Act 2025.
 *
 * All rates, thresholds, and category treatments are sourced from a
 * `RuleBundle` (see src/lib/tax) — nothing here is hardcoded. Category-based
 * VAT treatment (exempt/zero-rated schedules) is UNAVAILABLE except for the
 * rent exemption, because no Act schedule citation exists yet for the other
 * categories. See docs/TAX_RULE_PROVENANCE.md.
 */
import { requireRule, resolveVatObligationStatus } from "@/lib/tax/rule-loader";
import type { RuleBundle } from "@/lib/tax/types";
import type { VatObligationStatus } from "@/lib/tax/rule-loader";

export interface VATTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
  category: string;
  // VAT classification
  vatTreatment: "standard" | "exempt" | "zero-rated" | "out-of-scope";
  // For expenses: whether VAT is recoverable
  vatRecoverable?: boolean;
}

export interface VATCalculation {
  transactionId: string;
  grossAmount: number;
  vatRate: number;
  vatAmount: number;
  netAmount: number;
  vatTreatment: string;
  isRecoverable: boolean;
}

export interface VATSummary {
  period: string; // YYYY-MM format

  // Output VAT (VAT on sales)
  totalSalesGross: number;
  totalSalesVAT: number;

  // Input VAT (VAT on purchases)
  totalPurchasesGross: number;
  totalPurchasesVAT: number;
  recoverableVAT: number;

  // Net VAT payable
  netVATPayable: number;

  // Breakdown by category
  breakdown: VATBreakdownItem[];

  // Compliance
  filingDeadline: string;
  isRegistered: boolean;
}

export interface VATBreakdownItem {
  category: string;
  type: "income" | "expense";
  grossAmount: number;
  vatAmount: number;
  vatTreatment: string;
  count: number;
}

export interface VATFormData {
  formType: "A" | "B"; // Form A: Registered traders, Form B: Non-registered
  period: string;
  businessName: string;
  tinNumber: string;

  // Form A specific
  totalSalesInclusive?: number;
  totalSalesExclusive?: number;
  outputVAT?: number;

  totalPurchasesInclusive?: number;
  totalPurchasesExclusive?: number;
  inputVAT?: number;

  netVATPayable?: number;

  // Form B specific (non-registered)
  totalTurnover?: number;

  // Common
  submissionDate?: string;
  authorizedSignatory?: string;
}

const RENT_CATEGORY_PATTERN = /rent/i;

/**
 * VAT Service - Handles all VAT calculations and compliance.
 * Every method requires a `RuleBundle` (or an explicit rate) — there are no
 * static hardcoded rate/threshold/category constants on this class.
 */
export class VATService {
  /**
   * Determine VAT treatment for a transaction category.
   *
   * Only two outcomes can be determined without a verified category
   * schedule:
   *   - "out-of-scope": unregistered businesses don't charge VAT on income.
   *   - "exempt": ONLY for rent-like categories, backed by the verified
   *     vat.rent_exemption rule.
   *
   * Every other category throws, because the exempt/zero-rated category
   * schedules have not been seeded (no Act schedule citation available —
   * see docs/TAX_RULE_PROVENANCE.md). Callers that already know a
   * transaction's treatment (e.g. loaded from stored data) should NOT call
   * this method — pass `transaction.vatTreatment` straight into
   * `calculateTransactionVAT` instead.
   */
  static determineVATTreatment(
    bundle: RuleBundle,
    category: string,
    type: "income" | "expense",
    isRegistered: boolean,
  ): "exempt" | "out-of-scope" {
    if (!isRegistered && type === "income") {
      return "out-of-scope";
    }

    if (RENT_CATEGORY_PATTERN.test(category)) {
      const rentExemption = requireRule(bundle, "vat", "rent_exemption");
      if (rentExemption.value.exempt === true) {
        return "exempt";
      }
    }

    throw new Error(
      `VAT category schedule unavailable — exempt/zero-rated lists not verified. ` +
        `Category "${category}" cannot be classified beyond the rent exemption. ` +
        "See docs/TAX_RULE_PROVENANCE.md.",
    );
  }

  /**
   * Calculate VAT for a single transaction.
   *
   * Trusts the transaction's own `vatTreatment` (already classified
   * upstream) rather than re-deriving it — `determineVATTreatment` is
   * intentionally too strict to run on arbitrary stored categories.
   */
  static calculateTransactionVAT(
    transaction: VATTransaction,
    bundle: RuleBundle,
  ): VATCalculation {
    const treatment = transaction.vatTreatment;

    let vatRate = 0;
    let vatAmount = 0;
    let isRecoverable = false;

    switch (treatment) {
      case "standard": {
        vatRate = requireRule(bundle, "vat", "standard_rate").value.rate / 100;
        vatAmount = transaction.amount * vatRate;
        isRecoverable =
          transaction.type === "expense" &&
          (transaction.vatRecoverable ?? true);
        break;
      }

      case "zero-rated": {
        vatRate = requireRule(bundle, "vat", "zero_rate").value.rate / 100;
        vatAmount = 0;
        isRecoverable = transaction.type === "expense";
        break;
      }

      case "exempt":
        vatRate = 0;
        vatAmount = 0;
        isRecoverable = false;
        break;

      case "out-of-scope":
        vatRate = 0;
        vatAmount = 0;
        isRecoverable = false;
        break;
    }

    return {
      transactionId: transaction.id,
      grossAmount: transaction.amount,
      vatRate,
      vatAmount,
      netAmount:
        transaction.amount +
        (transaction.type === "income" ? vatAmount : -vatAmount),
      vatTreatment: treatment,
      isRecoverable,
    };
  }

  /**
   * Calculate VAT summary for a period.
   */
  static calculateVATSummary(
    transactions: VATTransaction[],
    period: string,
    isRegistered: boolean,
    bundle: RuleBundle,
  ): VATSummary {
    const breakdown: Map<string, VATBreakdownItem> = new Map();
    let totalSalesGross = 0;
    let totalSalesVAT = 0;
    let totalPurchasesGross = 0;
    let totalPurchasesVAT = 0;
    let recoverableVAT = 0;

    for (const transaction of transactions) {
      const calculation = this.calculateTransactionVAT(transaction, bundle);

      if (transaction.type === "income") {
        totalSalesGross += calculation.grossAmount;
        totalSalesVAT += calculation.vatAmount;
      } else {
        totalPurchasesGross += calculation.grossAmount;
        totalPurchasesVAT += calculation.vatAmount;
        if (calculation.isRecoverable) {
          recoverableVAT += calculation.vatAmount;
        }
      }

      const key = transaction.category;
      if (!breakdown.has(key)) {
        breakdown.set(key, {
          category: key,
          type: transaction.type,
          grossAmount: 0,
          vatAmount: 0,
          vatTreatment: calculation.vatTreatment,
          count: 0,
        });
      }

      const item = breakdown.get(key)!;
      item.grossAmount += calculation.grossAmount;
      item.vatAmount += calculation.vatAmount;
      item.count += 1;
    }

    const netVATPayable = totalSalesVAT - recoverableVAT;

    // Filing deadline (last day of month following the quarter)
    const [year, month] = period.split("-").map(Number);
    const quarter = Math.ceil(month / 3);
    const deadlineMonth = quarter * 3 + 1;
    const deadlineYear = deadlineMonth > 12 ? year + 1 : year;
    const filingDeadline = `${deadlineYear}-${String(deadlineMonth % 12 || 12).padStart(2, "0")}-28`;

    return {
      period,
      totalSalesGross,
      totalSalesVAT,
      totalPurchasesGross,
      totalPurchasesVAT,
      recoverableVAT,
      netVATPayable,
      breakdown: Array.from(breakdown.values()),
      filingDeadline,
      isRegistered,
    };
  }

  /**
   * Determine VAT registration/exemption obligation for a given turnover
   * and asset base. NEVER asserts a single answer while the three
   * candidate thresholds remain mutually exclusive and unverified — always
   * returns the full set of candidates instead. See
   * src/lib/tax/rule-loader.ts#resolveVatObligationStatus.
   */
  static getRegistrationObligation(
    bundle: RuleBundle,
    annualTurnover: number,
    totalAssets: number = 0,
  ): VatObligationStatus {
    return resolveVatObligationStatus(bundle, annualTurnover, totalAssets);
  }

  /**
   * Generate VAT Form A (for registered traders)
   */
  static generateFormA(
    summary: VATSummary,
    businessName: string,
    tinNumber: string,
  ): VATFormData {
    if (!summary.isRegistered) {
      throw new Error("Form A is only for registered VAT traders");
    }

    return {
      formType: "A",
      period: summary.period,
      businessName,
      tinNumber,
      totalSalesInclusive: summary.totalSalesGross + summary.totalSalesVAT,
      totalSalesExclusive: summary.totalSalesGross,
      outputVAT: summary.totalSalesVAT,
      totalPurchasesInclusive:
        summary.totalPurchasesGross + summary.totalPurchasesVAT,
      totalPurchasesExclusive: summary.totalPurchasesGross,
      inputVAT: summary.totalPurchasesVAT,
      netVATPayable: summary.netVATPayable,
      submissionDate: new Date().toISOString().split("T")[0],
    };
  }

  /**
   * Generate VAT Form B (for non-registered traders)
   */
  static generateFormB(
    annualTurnover: number,
    businessName: string,
  ): VATFormData {
    return {
      formType: "B",
      period: new Date().toISOString().substring(0, 7),
      businessName,
      tinNumber: "",
      totalTurnover: annualTurnover,
      submissionDate: new Date().toISOString().split("T")[0],
    };
  }

  /**
   * Extract VAT from a VAT-inclusive price. `rate` (e.g. 0.075 for 7.5%)
   * must be supplied by the caller — there is no default rate.
   */
  static extractVATFromInclusive(
    inclusivePrice: number,
    rate: number,
  ): {
    netAmount: number;
    vatAmount: number;
  } {
    const divisor = 1 + rate;
    const netAmount = inclusivePrice / divisor;
    const vatAmount = inclusivePrice - netAmount;

    return {
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
    };
  }

  /**
   * Add VAT to a VAT-exclusive price. `rate` (e.g. 0.075 for 7.5%) must be
   * supplied by the caller — there is no default rate.
   */
  static addVATToExclusive(
    exclusivePrice: number,
    rate: number,
  ): {
    netAmount: number;
    vatAmount: number;
    inclusivePrice: number;
  } {
    const vatAmount = exclusivePrice * rate;
    const inclusivePrice = exclusivePrice + vatAmount;

    return {
      netAmount: exclusivePrice,
      vatAmount: Math.round(vatAmount * 100) / 100,
      inclusivePrice: Math.round(inclusivePrice * 100) / 100,
    };
  }

  /**
   * Validate VAT compliance. Registration/exemption obligation is surfaced
   * as a warning (never a hard "must register" issue) while the threshold
   * conflict remains unresolved.
   */
  static validateCompliance(
    summary: VATSummary,
    bundle: RuleBundle,
    totalAssets: number = 0,
  ): {
    isCompliant: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    if (summary.isRegistered && summary.totalSalesGross === 0) {
      warnings.push("Registered for VAT but no sales recorded in period");
    }

    if (!summary.isRegistered) {
      const obligation = resolveVatObligationStatus(
        bundle,
        summary.totalSalesGross,
        totalAssets,
      );
      if (obligation.status === "unresolved") {
        warnings.push(
          `VAT registration/exemption threshold is unresolved (${obligation.candidates.length} conflicting unverified candidates — see review_queue). ` +
            `Verify turnover of ₦${summary.totalSalesGross.toLocaleString()} manually before assuming no obligation to register.`,
        );
      }
    }

    if (summary.netVATPayable < 0) {
      warnings.push(
        `VAT refund due: ₦${Math.abs(summary.netVATPayable).toLocaleString()}. Submit refund claim.`,
      );
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      warnings,
    };
  }
}
