/**
 * Application Constants
 * =====================
 * Centralized constants for the KOMPLEET platform.
 * Includes subscription limits, application configuration, and currency
 * helpers.
 *
 * IMPORTANT:
 *   - All monetary values are in KOBO (1 Naira = 100 Kobo)
 *   - Tax rates, thresholds, and brackets are NOT defined here. They are
 *     loaded from the `tax_rules` database table via `src/lib/tax/rule-loader.ts`
 *     and `RuleBundle`. See docs/TAX_RULE_PROVENANCE.md for why: every tax
 *     figure must be traceable to a dated, cited, human-verified rule rather
 *     than hardcoded in application code.
 *
 * USAGE:
 *   import { SUBSCRIPTION_TIERS, SUPPORTED_BANKS } from '@/lib/constants';
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface SubscriptionTier {
  /** Tier identifier */
  id: "free" | "starter" | "professional" | "enterprise";
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
  CODE: "NGN",
  /** Currency symbol */
  SYMBOL: "₦",
  /** Decimal places */
  DECIMALS: 2,
  /** Smallest unit name */
  SMALLEST_UNIT: "kobo",
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
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(naira);

  return showSymbol ? `${CURRENCY.SYMBOL}${formatted}` : formatted;
}

// ============================================================
// SUBSCRIPTION TIERS
// ============================================================

/**
 * KOMPLEET subscription tiers and limits
 */
export const SUBSCRIPTION_TIERS: readonly SubscriptionTier[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    transactionLimit: 50,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    features: [
      "Up to 50 transactions/month",
      "Basic categorization",
      "PIT calculator",
      "CSV export",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    priceMonthly: nairaToKobo(5_000),
    priceAnnual: nairaToKobo(50_000),
    transactionLimit: 500,
    maxFileSize: 25 * 1024 * 1024, // 25MB
    features: [
      "Up to 500 transactions/month",
      "AI categorization",
      "All tax calculators",
      "PDF & Excel export",
      "Bank statement parsing",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    priceMonthly: nairaToKobo(15_000),
    priceAnnual: nairaToKobo(150_000),
    transactionLimit: 999999, // Unlimited
    maxFileSize: 100 * 1024 * 1024, // 100MB
    features: [
      "Unlimited transactions",
      "AI categorization with learning",
      "All tax calculators",
      "All export formats",
      "Multi-bank support",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: nairaToKobo(50_000),
    priceAnnual: nairaToKobo(500_000),
    transactionLimit: 999999, // Unlimited
    maxFileSize: 500 * 1024 * 1024, // 500MB
    features: [
      "Everything in Professional",
      "Multi-user access",
      "Role-based permissions",
      "API access",
      "Custom integrations",
      "Dedicated support",
      "Audit trail",
    ],
  },
] as const;

/**
 * Get subscription tier by ID
 */
export function getSubscriptionTier(
  tierId: SubscriptionTier["id"],
): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find((tier) => tier.id === tierId);
}

/**
 * Get transaction limit for a tier
 */
export function getTransactionLimit(tierId: SubscriptionTier["id"]): number {
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
  { code: "GTB", name: "Guaranty Trust Bank", aliases: ["gtbank", "gt bank"] },
  {
    code: "FBN",
    name: "First Bank of Nigeria",
    aliases: ["first bank", "firstbank"],
  },
  { code: "UBA", name: "United Bank for Africa", aliases: ["uba"] },
  { code: "ACCESS", name: "Access Bank", aliases: ["access", "diamond bank"] },
  { code: "ZENITH", name: "Zenith Bank", aliases: ["zenith"] },
  { code: "FCMB", name: "First City Monument Bank", aliases: ["fcmb"] },
  { code: "STANBIC", name: "Stanbic IBTC Bank", aliases: ["stanbic", "ibtc"] },
  { code: "STERLING", name: "Sterling Bank", aliases: ["sterling"] },
  { code: "UNION", name: "Union Bank", aliases: ["union bank"] },
  { code: "FIDELITY", name: "Fidelity Bank", aliases: ["fidelity"] },
  { code: "WEMA", name: "Wema Bank", aliases: ["wema", "alat"] },
  { code: "ECOBANK", name: "Ecobank Nigeria", aliases: ["ecobank"] },
  { code: "KUDA", name: "Kuda Bank", aliases: ["kuda"] },
  { code: "OPAY", name: "OPay", aliases: ["opay"] },
  { code: "PALMPAY", name: "PalmPay", aliases: ["palmpay"] },
] as const;

/**
 * Supported file types for import
 */
export const SUPPORTED_FILE_TYPES = {
  CSV: {
    mimeTypes: ["text/csv", "application/csv"],
    extensions: [".csv"],
  },
  EXCEL: {
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
    extensions: [".xlsx", ".xls"],
  },
  PDF: {
    mimeTypes: ["application/pdf"],
    extensions: [".pdf"],
  },
} as const;

/**
 * Date formats used in Nigerian bank statements
 */
export const DATE_FORMATS = [
  "DD/MM/YYYY",
  "DD-MM-YYYY",
  "YYYY-MM-DD",
  "DD/MM/YY",
  "DD-MM-YY",
  "MM/DD/YYYY",
] as const;

/**
 * AI Categorization confidence thresholds
 */
export const AI_CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9, // Auto-apply category
  MEDIUM: 0.7, // Apply but flag for review
  LOW: 0.5, // Suggest only
  MINIMUM: 0.3, // Don't suggest
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
 * All application limits grouped together
 */
export const APP_LIMITS = {
  SUBSCRIPTIONS: SUBSCRIPTION_TIERS,
  RATE_LIMITS,
  PAGINATION,
  AI_CONFIDENCE: AI_CONFIDENCE_THRESHOLDS,
} as const;
