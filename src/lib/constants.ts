/**
 * Application Constants
 * =====================
 * Centralized constants for the KOMPLEET platform.
 * Includes Nigerian tax rates, subscription limits, and configuration.
 *
 * IMPORTANT:
 *   - All monetary values are in KOBO (1 Naira = 100 Kobo)
 *   - Tax rates are based on Nigeria 2024/2025 tax laws
 *   - Update annually when tax laws change
 *
 * USAGE:
 *   import { TAX_CONSTANTS, SUBSCRIPTION_LIMITS } from '@/lib/constants';
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface TaxBracket {
  /** Minimum amount for this bracket (in Kobo) */
  min: number;
  /** Maximum amount for this bracket (in Kobo, null = unlimited) */
  max: number | null;
  /** Tax rate as decimal (e.g., 0.07 = 7%) */
  rate: number;
  /** Human-readable description */
  description: string;
}

export interface WHTRate {
  /** Category of payment */
  category: string;
  /** Rate for resident recipients */
  residentRate: number;
  /** Rate for non-resident recipients */
  nonResidentRate: number;
  /** Minimum amount before WHT applies (in Kobo) */
  threshold: number;
}

export interface SubscriptionTier {
  /** Tier identifier */
  id: 'free' | 'starter' | 'professional' | 'enterprise';
  /** Display name */
  name: string;
  /** Monthly price in Kobo (0 for free) */
  priceMonthly: number;
  /** Annual price in Kobo (0 for free) */
  priceAnnual: number;
  /** Maximum transactions per month */
  transactionLimit: number;
  /** Maximum file upload size in bytes */
  maxFileSize: number;
  /** Features included */
  features: string[];
}

// ============================================================
// CURRENCY CONSTANTS
// ============================================================

/**
 * Currency configuration
 */
export const CURRENCY = {
  /** Currency code */
  CODE: 'NGN',
  /** Currency symbol */
  SYMBOL: '₦',
  /** Decimal places */
  DECIMALS: 2,
  /** Smallest unit name */
  SMALLEST_UNIT: 'kobo',
  /** Conversion factor (1 Naira = 100 Kobo) */
  KOBO_PER_NAIRA: 100,
} as const;

/**
 * Convert Naira to Kobo
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * CURRENCY.KOBO_PER_NAIRA);
}

/**
 * Convert Kobo to Naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / CURRENCY.KOBO_PER_NAIRA;
}

/**
 * Format Kobo amount as Naira string
 */
export function formatNaira(kobo: number, showSymbol = true): string {
  const naira = koboToNaira(kobo);
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira);

  return showSymbol ? `${CURRENCY.SYMBOL}${formatted}` : formatted;
}

// ============================================================
// PERSONAL INCOME TAX (PIT) CONSTANTS
// ============================================================

/**
 * Nigeria Personal Income Tax (PIT) brackets for 2024/2025
 * Based on the Personal Income Tax Act (PITA) as amended
 *
 * Progressive tax rates on taxable income after reliefs
 */
export const PIT_BRACKETS: readonly TaxBracket[] = [
  {
    min: 0,
    max: nairaToKobo(300_000),
    rate: 0.07,
    description: 'First ₦300,000 at 7%',
  },
  {
    min: nairaToKobo(300_000),
    max: nairaToKobo(600_000),
    rate: 0.11,
    description: 'Next ₦300,000 at 11%',
  },
  {
    min: nairaToKobo(600_000),
    max: nairaToKobo(1_100_000),
    rate: 0.15,
    description: 'Next ₦500,000 at 15%',
  },
  {
    min: nairaToKobo(1_100_000),
    max: nairaToKobo(1_600_000),
    rate: 0.19,
    description: 'Next ₦500,000 at 19%',
  },
  {
    min: nairaToKobo(1_600_000),
    max: nairaToKobo(3_200_000),
    rate: 0.21,
    description: 'Next ₦1,600,000 at 21%',
  },
  {
    min: nairaToKobo(3_200_000),
    max: null,
    rate: 0.24,
    description: 'Above ₦3,200,000 at 24%',
  },
] as const;

/**
 * PIT Relief and Deduction Constants
 */
export const PIT_RELIEFS = {
  /**
   * Consolidated Relief Allowance (CRA)
   * Higher of ₦200,000 OR 1% of gross income, PLUS 20% of gross income
   */
  CRA: {
    /** Fixed component */
    FIXED_AMOUNT: nairaToKobo(200_000),
    /** Percentage of gross income (alternative to fixed) */
    GROSS_INCOME_PERCENT: 0.01,
    /** Additional percentage of gross income */
    ADDITIONAL_PERCENT: 0.20,
  },

  /**
   * Pension contribution relief
   * Maximum 8% of gross income (employee's mandatory contribution)
   */
  PENSION: {
    MAX_RATE: 0.08,
    DESCRIPTION: 'Pension contribution (max 8% of gross)',
  },

  /**
   * National Housing Fund (NHF) contribution
   * 2.5% of basic salary
   */
  NHF: {
    RATE: 0.025,
    DESCRIPTION: 'NHF contribution (2.5% of basic)',
  },

  /**
   * Life insurance premium relief
   * Actual premium paid (subject to limits)
   */
  LIFE_INSURANCE: {
    MAX_RATE: 0.10, // Max 10% of gross income
    DESCRIPTION: 'Life insurance premium',
  },

  /**
   * Gratuity is tax-exempt
   */
  GRATUITY_EXEMPT: true,
} as const;

/**
 * Minimum tax threshold
 * If total income exceeds ₦30M, minimum tax of 1% applies
 */
export const PIT_MINIMUM_TAX = {
  THRESHOLD: nairaToKobo(30_000_000),
  RATE: 0.01,
} as const;

// ============================================================
// COMPANY INCOME TAX (CIT) CONSTANTS
// ============================================================

/**
 * Nigeria Company Income Tax (CIT) rates for 2024/2025
 * Based on the Companies Income Tax Act (CITA)
 */
export const CIT_RATES = {
  /**
   * Small companies: Turnover ≤ ₦25 million
   * 0% CIT (tax holiday)
   */
  SMALL: {
    MAX_TURNOVER: nairaToKobo(25_000_000),
    RATE: 0.00,
    DESCRIPTION: 'Small company (turnover ≤ ₦25M)',
  },

  /**
   * Medium companies: Turnover > ₦25M and ≤ ₦100M
   * 20% CIT
   */
  MEDIUM: {
    MIN_TURNOVER: nairaToKobo(25_000_000),
    MAX_TURNOVER: nairaToKobo(100_000_000),
    RATE: 0.20,
    DESCRIPTION: 'Medium company (₦25M < turnover ≤ ₦100M)',
  },

  /**
   * Large companies: Turnover > ₦100 million
   * 30% CIT
   */
  LARGE: {
    MIN_TURNOVER: nairaToKobo(100_000_000),
    RATE: 0.30,
    DESCRIPTION: 'Large company (turnover > ₦100M)',
  },
} as const;

/**
 * CIT Additional Taxes and Levies
 */
export const CIT_ADDITIONAL = {
  /**
   * Tertiary Education Tax (TET)
   * 2.5% of assessable profit (for companies only)
   */
  TET: {
    RATE: 0.025,
    DESCRIPTION: 'Tertiary Education Tax',
  },

  /**
   * Nigeria Police Trust Fund Levy
   * 0.005% of net profit
   */
  POLICE_LEVY: {
    RATE: 0.00005,
    DESCRIPTION: 'Police Trust Fund Levy',
  },

  /**
   * NASENI Levy (for certain companies)
   * 0.25% of profit before tax
   */
  NASENI: {
    RATE: 0.0025,
    DESCRIPTION: 'NASENI Levy',
  },

  /**
   * Development levy
   * Fixed ₦5,000 for all companies
   */
  DEVELOPMENT_LEVY: {
    AMOUNT: nairaToKobo(5_000),
    DESCRIPTION: 'Annual development levy',
  },
} as const;

/**
 * CIT Minimum Tax
 * 0.5% of gross turnover (if no taxable profit)
 */
export const CIT_MINIMUM_TAX = {
  RATE: 0.005,
  DESCRIPTION: 'Minimum tax (0.5% of turnover)',
} as const;

/**
 * Capital Allowances for CIT
 */
export const CAPITAL_ALLOWANCES = {
  /** Initial allowance (year of purchase) */
  INITIAL: {
    BUILDING: 0.15,
    PLANT_MACHINERY: 0.50,
    FURNITURE: 0.25,
    MOTOR_VEHICLE: 0.50,
  },
  /** Annual allowance (subsequent years) */
  ANNUAL: {
    BUILDING: 0.10,
    PLANT_MACHINERY: 0.25,
    FURNITURE: 0.20,
    MOTOR_VEHICLE: 0.25,
  },
} as const;

// ============================================================
// VALUE ADDED TAX (VAT) CONSTANTS
// ============================================================

/**
 * Nigeria VAT rate
 * Increased from 5% to 7.5% effective February 1, 2020
 */
export const VAT_RATE = 0.075;

/**
 * VAT Registration Threshold
 * Businesses with turnover ≤ ₦25M in a calendar year are exempt
 */
export const VAT_REGISTRATION_THRESHOLD = nairaToKobo(25_000_000);

/**
 * VAT-Exempt Categories
 * Based on the VAT Act Schedule I
 */
export const VAT_EXEMPT_CATEGORIES = [
  'medical_pharmaceutical',
  'basic_food',
  'books_educational',
  'baby_products',
  'agricultural_produce',
  'fertilizer_seeds',
  'veterinary_medicine',
  'locally_produced_textiles',
  'exports',
] as const;

/**
 * Zero-Rated Categories (0% VAT but can claim input VAT)
 */
export const VAT_ZERO_RATED = [
  'exports',
  'goods_services_diplomats',
  'humanitarian_goods',
] as const;

// ============================================================
// WITHHOLDING TAX (WHT) CONSTANTS
// ============================================================

/**
 * Withholding Tax rates for various payment categories
 * Rates differ for resident vs non-resident recipients
 */
export const WHT_RATES: readonly WHTRate[] = [
  {
    category: 'dividends',
    residentRate: 0.10,
    nonResidentRate: 0.10,
    threshold: nairaToKobo(50_000),
  },
  {
    category: 'interest',
    residentRate: 0.10,
    nonResidentRate: 0.10,
    threshold: nairaToKobo(50_000),
  },
  {
    category: 'royalties',
    residentRate: 0.10,
    nonResidentRate: 0.10,
    threshold: nairaToKobo(50_000),
  },
  {
    category: 'rent',
    residentRate: 0.10,
    nonResidentRate: 0.10,
    threshold: nairaToKobo(50_000),
  },
  {
    category: 'commission',
    residentRate: 0.10,
    nonResidentRate: 0.10,
    threshold: nairaToKobo(50_000),
  },
  {
    category: 'consultancy',
    residentRate: 0.10,
    nonResidentRate: 0.10,
    threshold: nairaToKobo(50_000),
  },
  {
    category: 'technical_services',
    residentRate: 0.10,
    nonResidentRate: 0.10,
    threshold: nairaToKobo(50_000),
  },
  {
    category: 'management_services',
    residentRate: 0.10,
    nonResidentRate: 0.10,
    threshold: nairaToKobo(50_000),
  },
  {
    category: 'directors_fees',
    residentRate: 0.10,
    nonResidentRate: 0.10,
    threshold: nairaToKobo(50_000),
  },
  {
    category: 'contracts',
    residentRate: 0.05,
    nonResidentRate: 0.10,
    threshold: nairaToKobo(50_000),
  },
] as const;

/**
 * Default WHT threshold (applies to most categories)
 */
export const WHT_DEFAULT_THRESHOLD = nairaToKobo(50_000);

// ============================================================
// SUBSCRIPTION TIERS
// ============================================================

/**
 * KOMPLEET subscription tiers and limits
 */
export const SUBSCRIPTION_TIERS: readonly SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    transactionLimit: 50,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    features: [
      'Up to 50 transactions/month',
      'Basic categorization',
      'PIT calculator',
      'CSV export',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: nairaToKobo(5_000),
    priceAnnual: nairaToKobo(50_000),
    transactionLimit: 500,
    maxFileSize: 25 * 1024 * 1024, // 25MB
    features: [
      'Up to 500 transactions/month',
      'AI categorization',
      'All tax calculators',
      'PDF & Excel export',
      'Bank statement parsing',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    priceMonthly: nairaToKobo(15_000),
    priceAnnual: nairaToKobo(150_000),
    transactionLimit: 999999, // Unlimited
    maxFileSize: 100 * 1024 * 1024, // 100MB
    features: [
      'Unlimited transactions',
      'AI categorization with learning',
      'All tax calculators',
      'All export formats',
      'Multi-bank support',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: nairaToKobo(50_000),
    priceAnnual: nairaToKobo(500_000),
    transactionLimit: 999999, // Unlimited
    maxFileSize: 500 * 1024 * 1024, // 500MB
    features: [
      'Everything in Professional',
      'Multi-user access',
      'Role-based permissions',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Audit trail',
    ],
  },
] as const;

/**
 * Get subscription tier by ID
 */
export function getSubscriptionTier(
  tierId: SubscriptionTier['id']
): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find((tier) => tier.id === tierId);
}

/**
 * Get transaction limit for a tier
 */
export function getTransactionLimit(tierId: SubscriptionTier['id']): number {
  const tier = getSubscriptionTier(tierId);
  return tier?.transactionLimit ?? 50;
}

// ============================================================
// APPLICATION CONSTANTS
// ============================================================

/**
 * Supported Nigerian banks for statement parsing
 */
export const SUPPORTED_BANKS = [
  { code: 'GTB', name: 'Guaranty Trust Bank', aliases: ['gtbank', 'gt bank'] },
  { code: 'FBN', name: 'First Bank of Nigeria', aliases: ['first bank', 'firstbank'] },
  { code: 'UBA', name: 'United Bank for Africa', aliases: ['uba'] },
  { code: 'ACCESS', name: 'Access Bank', aliases: ['access', 'diamond bank'] },
  { code: 'ZENITH', name: 'Zenith Bank', aliases: ['zenith'] },
  { code: 'FCMB', name: 'First City Monument Bank', aliases: ['fcmb'] },
  { code: 'STANBIC', name: 'Stanbic IBTC Bank', aliases: ['stanbic', 'ibtc'] },
  { code: 'STERLING', name: 'Sterling Bank', aliases: ['sterling'] },
  { code: 'UNION', name: 'Union Bank', aliases: ['union bank'] },
  { code: 'FIDELITY', name: 'Fidelity Bank', aliases: ['fidelity'] },
  { code: 'WEMA', name: 'Wema Bank', aliases: ['wema', 'alat'] },
  { code: 'ECOBANK', name: 'Ecobank Nigeria', aliases: ['ecobank'] },
  { code: 'KUDA', name: 'Kuda Bank', aliases: ['kuda'] },
  { code: 'OPAY', name: 'OPay', aliases: ['opay'] },
  { code: 'PALMPAY', name: 'PalmPay', aliases: ['palmpay'] },
] as const;

/**
 * Supported file types for import
 */
export const SUPPORTED_FILE_TYPES = {
  CSV: {
    mimeTypes: ['text/csv', 'application/csv'],
    extensions: ['.csv'],
  },
  EXCEL: {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
    extensions: ['.xlsx', '.xls'],
  },
  PDF: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
  },
} as const;

/**
 * Date formats used in Nigerian bank statements
 */
export const DATE_FORMATS = [
  'DD/MM/YYYY',
  'DD-MM-YYYY',
  'YYYY-MM-DD',
  'DD/MM/YY',
  'DD-MM-YY',
  'MM/DD/YYYY',
] as const;

/**
 * Tax year configuration
 * Nigeria uses calendar year (January 1 - December 31)
 */
export const TAX_YEAR = {
  START_MONTH: 1, // January
  START_DAY: 1,
  END_MONTH: 12, // December
  END_DAY: 31,
  FILING_DEADLINE_INDIVIDUAL: { month: 3, day: 31 }, // March 31
  FILING_DEADLINE_COMPANY: { month: 6, day: 30 }, // June 30
} as const;

/**
 * AI Categorization confidence thresholds
 */
export const AI_CONFIDENCE_THRESHOLDS = {
  HIGH: 0.90, // Auto-apply category
  MEDIUM: 0.70, // Apply but flag for review
  LOW: 0.50, // Suggest only
  MINIMUM: 0.30, // Don't suggest
} as const;

/**
 * Rate limiting defaults
 */
export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 60,
  AI_REQUESTS_PER_MINUTE: 20,
  FILE_UPLOADS_PER_HOUR: 10,
  EXPORT_REQUESTS_PER_HOUR: 20,
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

// ============================================================
// EXPORT GROUPED CONSTANTS
// ============================================================

/**
 * All tax-related constants grouped together
 */
export const TAX_CONSTANTS = {
  PIT: {
    BRACKETS: PIT_BRACKETS,
    RELIEFS: PIT_RELIEFS,
    MINIMUM_TAX: PIT_MINIMUM_TAX,
  },
  CIT: {
    RATES: CIT_RATES,
    ADDITIONAL: CIT_ADDITIONAL,
    MINIMUM_TAX: CIT_MINIMUM_TAX,
    CAPITAL_ALLOWANCES,
  },
  VAT: {
    RATE: VAT_RATE,
    REGISTRATION_THRESHOLD: VAT_REGISTRATION_THRESHOLD,
    EXEMPT_CATEGORIES: VAT_EXEMPT_CATEGORIES,
    ZERO_RATED: VAT_ZERO_RATED,
  },
  WHT: {
    RATES: WHT_RATES,
    DEFAULT_THRESHOLD: WHT_DEFAULT_THRESHOLD,
  },
  YEAR: TAX_YEAR,
} as const;

/**
 * All application limits grouped together
 */
export const APP_LIMITS = {
  SUBSCRIPTIONS: SUBSCRIPTION_TIERS,
  RATE_LIMITS,
  PAGINATION,
  AI_CONFIDENCE: AI_CONFIDENCE_THRESHOLDS,
} as const;
