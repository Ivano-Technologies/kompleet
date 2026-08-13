/**
 * Library Exports
 * ===============
 * Central export point for all utility modules.
 *
 * USAGE:
 *   import { env, logger, SUBSCRIPTION_TIERS } from '@/lib';
 *
 * NOTE: Tax rates/thresholds are NOT exported here — they are loaded from
 * the `tax_rules` database via `src/lib/tax/rule-loader.ts`. See
 * docs/TAX_RULE_PROVENANCE.md.
 */

// Environment configuration
export { env, isProduction, isDevelopment, isTest, isAIEnabled } from "./env";
export type { Env, ServerEnv, ClientEnv } from "./env";

// Logging
export {
  logger,
  createRequestLogger,
  createUserLogger,
  logDuration,
  formatError,
} from "./logger";
export type { Logger, LogLevel, LogContext } from "./logger";

// Constants
export {
  // Currency
  CURRENCY,
  nairaToKobo,
  koboToNaira,
  formatNaira,
  // Subscriptions
  SUBSCRIPTION_TIERS,
  getSubscriptionTier,
  getTransactionLimit,
  // App config
  SUPPORTED_BANKS,
  SUPPORTED_FILE_TYPES,
  DATE_FORMATS,
  AI_CONFIDENCE_THRESHOLDS,
  RATE_LIMITS,
  PAGINATION,
  APP_LIMITS,
} from "./constants";
export type { SubscriptionTier } from "./constants";
