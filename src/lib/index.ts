/**
 * Library Exports
 * ===============
 * Central export point for all utility modules.
 *
 * USAGE:
 *   import { env, logger, TAX_CONSTANTS } from '@/lib';
 */

// Environment configuration
export { env, isProduction, isDevelopment, isTest, isAIEnabled } from './env';
export type { Env, ServerEnv, ClientEnv } from './env';

// Logging
export {
  logger,
  createRequestLogger,
  createUserLogger,
  logDuration,
  formatError,
} from './logger';
export type { Logger, LogLevel, LogContext } from './logger';

// Constants
export {
  // Currency
  CURRENCY,
  nairaToKobo,
  koboToNaira,
  formatNaira,
  // Tax constants
  TAX_CONSTANTS,
  PIT_BRACKETS,
  PIT_RELIEFS,
  PIT_MINIMUM_TAX,
  CIT_RATES,
  CIT_ADDITIONAL,
  CIT_MINIMUM_TAX,
  CAPITAL_ALLOWANCES,
  VAT_RATE,
  VAT_REGISTRATION_THRESHOLD,
  VAT_EXEMPT_CATEGORIES,
  VAT_ZERO_RATED,
  WHT_RATES,
  WHT_DEFAULT_THRESHOLD,
  // Subscriptions
  SUBSCRIPTION_TIERS,
  getSubscriptionTier,
  getTransactionLimit,
  // App config
  SUPPORTED_BANKS,
  SUPPORTED_FILE_TYPES,
  DATE_FORMATS,
  TAX_YEAR,
  AI_CONFIDENCE_THRESHOLDS,
  RATE_LIMITS,
  PAGINATION,
  APP_LIMITS,
} from './constants';
export type { TaxBracket, WHTRate, SubscriptionTier } from './constants';
