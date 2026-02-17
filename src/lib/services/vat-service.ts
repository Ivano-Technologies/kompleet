/**
 * VAT (Value Added Tax) Service
 * Implements Nigeria VAT calculations per VAT Act
 * Standard Rate: 7.5%
 * Effective Date: January 1, 2026
 */

export interface VATTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  // VAT classification
  vatTreatment: 'standard' | 'exempt' | 'zero-rated' | 'out-of-scope';
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
  netVATPay able: number;
  
  // Breakdown by category
  breakdown: VATBreakdownItem[];
  
  // Compliance
  filingDeadline: string;
  isRegistered: boolean;
}

export interface VATBreakdownItem {
  category: string;
  type: 'income' | 'expense';
  grossAmount: number;
  vatAmount: number;
  vatTreatment: string;
  count: number;
}

export interface VATFormData {
  formType: 'A' | 'B'; // Form A: Registered traders, Form B: Non-registered
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

/**
 * VAT Service - Handles all VAT calculations and compliance
 */
export class VATService {
  // VAT rates
  private static readonly STANDARD_RATE = 0.075; // 7.5%
  private static readonly ZERO_RATE = 0.0;
  
  // VAT registration threshold (annual turnover)
  private static readonly REGISTRATION_THRESHOLD = 25_000_000; // ₦25 million
  
  // Exempt supplies (no VAT charged, no VAT recovery)
  private static readonly EXEMPT_CATEGORIES = [
    'medical_services',
    'education',
    'financial_services',
    'insurance',
    'residential_rent',
    'agricultural_produce',
  ];
  
  // Zero-rated supplies (no VAT charged, VAT recovery allowed)
  private static readonly ZERO_RATED_CATEGORIES = [
    'exported_goods',
    'export_services',
    'agricultural_products',
    'food_items',
  ];

  /**
   * Determine VAT treatment for a transaction
   */
  static determineVATTreatment(
    category: string,
    type: 'income' | 'expense',
    isRegistered: boolean
  ): 'standard' | 'exempt' | 'zero-rated' | 'out-of-scope' {
    // Unregistered businesses don't charge VAT
    if (!isRegistered && type === 'income') {
      return 'out-of-scope';
    }

    // Check if exempt
    if (this.EXEMPT_CATEGORIES.includes(category.toLowerCase())) {
      return 'exempt';
    }

    // Check if zero-rated
    if (this.ZERO_RATED_CATEGORIES.includes(category.toLowerCase())) {
      return 'zero-rated';
    }

    // Default to standard rate
    return 'standard';
  }

  /**
   * Calculate VAT for a single transaction
   */
  static calculateTransactionVAT(
    transaction: VATTransaction,
    isRegistered: boolean
  ): VATCalculation {
    const treatment = this.determineVATTreatment(
      transaction.category,
      transaction.type,
      isRegistered
    );

    let vatRate = 0;
    let vatAmount = 0;
    let isRecoverable = false;

    switch (treatment) {
      case 'standard':
        vatRate = this.STANDARD_RATE;
        vatAmount = transaction.amount * vatRate;
        // For expenses, VAT is recoverable if marked as such
        isRecoverable = transaction.type === 'expense' && (transaction.vatRecoverable ?? true);
        break;

      case 'zero-rated':
        vatRate = this.ZERO_RATE;
        vatAmount = 0;
        // Zero-rated supplies allow VAT recovery on inputs
        isRecoverable = transaction.type === 'expense';
        break;

      case 'exempt':
        vatRate = 0;
        vatAmount = 0;
        // Exempt supplies do NOT allow VAT recovery
        isRecoverable = false;
        break;

      case 'out-of-scope':
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
      netAmount: transaction.amount + (transaction.type === 'income' ? vatAmount : -vatAmount),
      vatTreatment: treatment,
      isRecoverable,
    };
  }

  /**
   * Calculate VAT summary for a period
   */
  static calculateVATSummary(
    transactions: VATTransaction[],
    period: string,
    isRegistered: boolean
  ): VATSummary {
    const breakdown: Map<string, VATBreakdownItem> = new Map();
    let totalSalesGross = 0;
    let totalSalesVAT = 0;
    let totalPurchasesGross = 0;
    let totalPurchasesVAT = 0;
    let recoverableVAT = 0;

    // Process each transaction
    for (const transaction of transactions) {
      const calculation = this.calculateTransactionVAT(transaction, isRegistered);

      // Update totals
      if (transaction.type === 'income') {
        totalSalesGross += calculation.grossAmount;
        totalSalesVAT += calculation.vatAmount;
      } else {
        totalPurchasesGross += calculation.grossAmount;
        totalPurchasesVAT += calculation.vatAmount;
        if (calculation.isRecoverable) {
          recoverableVAT += calculation.vatAmount;
        }
      }

      // Update breakdown
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

    // Calculate net VAT payable
    const netVATPayable = totalSalesVAT - recoverableVAT;

    // Filing deadline (last day of month following the quarter)
    const [year, month] = period.split('-').map(Number);
    const quarter = Math.ceil(month / 3);
    const deadlineMonth = quarter * 3 + 1;
    const deadlineYear = deadlineMonth > 12 ? year + 1 : year;
    const filingDeadline = `${deadlineYear}-${String(deadlineMonth % 12 || 12).padStart(2, '0')}-28`;

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
   * Check if business qualifies for VAT registration
   */
  static qualifiesForRegistration(annualTurnover: number): boolean {
    return annualTurnover >= this.REGISTRATION_THRESHOLD;
  }

  /**
   * Generate VAT Form A (for registered traders)
   */
  static generateFormA(summary: VATSummary, businessName: string, tinNumber: string): VATFormData {
    if (!summary.isRegistered) {
      throw new Error('Form A is only for registered VAT traders');
    }

    return {
      formType: 'A',
      period: summary.period,
      businessName,
      tinNumber,
      totalSalesInclusive: summary.totalSalesGross + summary.totalSalesVAT,
      totalSalesExclusive: summary.totalSalesGross,
      outputVAT: summary.totalSalesVAT,
      totalPurchasesInclusive: summary.totalPurchasesGross + summary.totalPurchasesVAT,
      totalPurchasesExclusive: summary.totalPurchasesGross,
      inputVAT: summary.totalPurchasesVAT,
      netVATPayable: summary.netVATPayable,
      submissionDate: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Generate VAT Form B (for non-registered traders)
   */
  static generateFormB(annualTurnover: number, businessName: string): VATFormData {
    return {
      formType: 'B',
      period: new Date().toISOString().substring(0, 7),
      businessName,
      tinNumber: '',
      totalTurnover: annualTurnover,
      submissionDate: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Calculate VAT on inclusive price (price includes VAT)
   * Useful for retail transactions
   */
  static extractVATFromInclusive(inclusivePrice: number, rate: number = this.STANDARD_RATE): {
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
   * Calculate VAT on exclusive price (price excludes VAT)
   * Useful for B2B transactions
   */
  static addVATToExclusive(exclusivePrice: number, rate: number = this.STANDARD_RATE): {
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
   * Validate VAT compliance
   */
  static validateCompliance(summary: VATSummary): {
    isCompliant: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check if registered but no sales
    if (summary.isRegistered && summary.totalSalesGross === 0) {
      warnings.push('Registered for VAT but no sales recorded in period');
    }

    // Check if unregistered but high turnover
    if (!summary.isRegistered && summary.totalSalesGross > this.REGISTRATION_THRESHOLD) {
      issues.push(
        `Turnover (₦${summary.totalSalesGross.toLocaleString()}) exceeds registration threshold (₦${this.REGISTRATION_THRESHOLD.toLocaleString()}). Must register for VAT.`
      );
    }

    // Check for negative net VAT (refund due)
    if (summary.netVATPayable < 0) {
      warnings.push(
        `VAT refund due: ₦${Math.abs(summary.netVATPayable).toLocaleString()}. Submit refund claim.`
      );
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      warnings,
    };
  }
}
