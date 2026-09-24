/**
 * Environment Variable Validation
 *
 * This module validates required environment variables at startup.
 * It ensures all necessary configuration is present before the app runs.
 *
 * Key principles:
 * - Fail fast: Detect missing vars early
 * - Clear errors: Specify which vars are missing
 * - Type-safe: Export typed env object
 * - No secrets in client: Validate prefixes
 */

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = {
  // Server-only variables
  OPENAI_API_KEY: "OpenAI API key for AI features",
  STRIPE_SECRET_KEY: "Stripe secret key for payments",
  STRIPE_WEBHOOK_SECRET: "Stripe webhook signing secret",
  STRIPE_PRICE_PRO: "Stripe price ID for Pro plan",
  STRIPE_PRICE_ENTERPRISE: "Stripe price ID for Enterprise plan",
} as const;

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  NODE_ENV: "development",
  DATABASE_URL: "", // Optional leftover; app data is Convex
} as const;

/**
 * Validated and typed environment variables
 */
export interface ValidatedEnv {
  // Server-only
  OPENAI_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_PRO: string;
  STRIPE_PRICE_ENTERPRISE: string;

  // Optional
  NODE_ENV: string;
  DATABASE_URL: string;
}

/**
 * Validation result type
 */
type ValidationResult =
  | { valid: true; env: ValidatedEnv }
  | { valid: false; errors: string[] };

/**
 * Validates all required environment variables
 *
 * @returns Validation result with typed env object or errors
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const env: Partial<ValidatedEnv> = {};

  // Check required variables
  for (const [key, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];

    if (!value || value.trim() === "") {
      errors.push(
        `Missing required environment variable: ${key} (${description})`,
      );
    } else {
      env[key as keyof ValidatedEnv] = value;
    }
  }

  // Add optional variables with defaults
  for (const [key, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    env[key as keyof ValidatedEnv] = process.env[key] || defaultValue;
  }

  // Check for accidentally exposed secrets (common mistake)
  const publicVars = Object.keys(process.env).filter((key) =>
    key.startsWith("NEXT_PUBLIC_"),
  );
  const dangerousPublicVars = publicVars.filter(
    (key) =>
      key.toLowerCase().includes("secret") ||
      key.toLowerCase().includes("private") ||
      (key.toLowerCase().includes("key") && !key.includes("ANON")),
  );

  if (dangerousPublicVars.length > 0) {
    errors.push(
      `Potentially sensitive variables exposed with NEXT_PUBLIC_ prefix: ${dangerousPublicVars.join(", ")}`,
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, env: env as ValidatedEnv };
}

/**
 * Validates environment and throws if invalid
 * Use this at app startup to fail fast
 *
 * @throws Error with detailed validation errors
 * @returns Validated environment object
 */
export function requireValidEnv(): ValidatedEnv {
  const result = validateEnv();

  if (!result.valid) {
    const errorMessage = [
      "❌ Environment validation failed:",
      "",
      ...result.errors.map((err) => `  • ${err}`),
      "",
      "Please check your .env.local file and ensure all required variables are set.",
      "See .env.example for reference.",
    ].join("\n");

    throw new Error(errorMessage);
  }

  return result.env;
}

/**
 * Checks if we're running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Checks if we're running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Checks if we're running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}

/**
 * Safe environment access with validation
 * This should be called once at app startup
 */
let cachedEnv: ValidatedEnv | null = null;

export function getEnv(): ValidatedEnv {
  if (!cachedEnv) {
    cachedEnv = requireValidEnv();
  }
  return cachedEnv;
}
