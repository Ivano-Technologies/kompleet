/**
 * Environment Variable Validation
 * ================================
 * Validates all environment variables at build/startup time using Zod.
 * Fails fast if required variables are missing or invalid.
 */

import { z } from "zod";

// ============================================================
// SERVER-SIDE ENVIRONMENT VARIABLES
// ============================================================

const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Supabase (server-side service role)
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required")
    .startsWith("eyJ", "SUPABASE_SERVICE_ROLE_KEY must be a valid JWT"),

  // OpenAI
  OPENAI_API_KEY: z
    .string()
    .min(1, "OPENAI_API_KEY is required")
    .startsWith("sk-", "OPENAI_API_KEY must start with sk-"),

  // Anthropic (optional)
  ANTHROPIC_API_KEY: z
    .string()
    .startsWith("sk-ant-", "ANTHROPIC_API_KEY must start with sk-ant-")
    .optional(),

  // AI Configuration
  AI_ENABLED: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default(true),

  AI_PRIMARY_PROVIDER: z.enum(["openai", "anthropic"]).default("openai"),

  AI_FALLBACK_ENABLED: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default(true),

  AI_MAX_RETRIES: z
    .string()
    .optional()
    .transform((val) => parseInt(val ?? "3", 10))
    .pipe(z.number().min(0).max(10))
    .default(3),

  AI_TIMEOUT_MS: z
    .string()
    .optional()
    .transform((val) => parseInt(val ?? "30000", 10))
    .pipe(z.number().min(1000).max(120000))
    .default(30000),

  // Rate limiting
  RATE_LIMIT_REQUESTS_PER_MINUTE: z
    .string()
    .optional()
    .transform((val) => parseInt(val ?? "60", 10))
    .pipe(z.number().min(1).max(1000))
    .default(60),

  RATE_LIMIT_AI_TOKENS_PER_REQUEST: z
    .string()
    .optional()
    .transform((val) => parseInt(val ?? "4000", 10))
    .pipe(z.number().min(100).max(100000))
    .default(4000),

  // Payments
  PAYSTACK_SECRET_KEY: z
    .string()
    .startsWith("sk_", "PAYSTACK_SECRET_KEY must start with sk_")
    .optional(),

  PAYSTACK_WEBHOOK_SECRET: z.string().min(1).optional(),

  // App security
  APP_SECRET: z
    .string()
    .min(32, "APP_SECRET must be at least 32 characters")
    .optional(),

  // Logging
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  // Error tracking
  SENTRY_DSN: z.string().url().optional(),
});

// ============================================================
// CLIENT-SIDE ENVIRONMENT VARIABLES
// ============================================================

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required")
    .startsWith("eyJ", "NEXT_PUBLIC_SUPABASE_ANON_KEY must be a valid JWT"),

  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  NEXT_PUBLIC_API_URL: z.string().url().optional(),

  // Feature flags
  NEXT_PUBLIC_ENABLE_AI_CATEGORIZATION: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default(true),

  NEXT_PUBLIC_ENABLE_PDF_PARSING: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default(true),

  NEXT_PUBLIC_ENABLE_MULTI_USER: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default(false),

  // Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().startsWith("G-").optional(),

  // Payments
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z
    .string()
    .startsWith("pk_", "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY must start with pk_")
    .optional(),
});

// ============================================================
// TYPES
// ============================================================

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
export type Env = ServerEnv & ClientEnv;

// ============================================================
// VALIDATION
// ============================================================

function formatZodError(error: z.ZodError<any>): string {
  return error.issues
    .map((issue) => `• ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

function validateEnv(): Env {
  const isServer = typeof window === "undefined";
  const isCI = process.env.CI === "true";

  const rawEnv = process.env as Record<string, string | undefined>;

  if (isServer) {
    const result = serverSchema.merge(clientSchema).safeParse(rawEnv);

    if (!result.success) {
      const formatted = formatZodError(result.error);

      // Allow placeholders in development or CI environments
      if (process.env.NODE_ENV === "development" || isCI) {
        const envName = isCI ? "CI" : "development";
        console.warn(
          `⚠️  Environment validation failed (${envName} mode):\n`,
          formatted,
        );

        return serverSchema.merge(clientSchema).parse({
          ...rawEnv,
          SUPABASE_SERVICE_ROLE_KEY:
            rawEnv.SUPABASE_SERVICE_ROLE_KEY ?? "eyJ_dev_placeholder",
          OPENAI_API_KEY: rawEnv.OPENAI_API_KEY ?? "sk-dev_placeholder",
          NEXT_PUBLIC_SUPABASE_URL:
            rawEnv.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJ_dev_placeholder",
        });
      }

      throw new Error(`❌ Environment validation failed:\n${formatted}`);
    }

    return result.data;
  }

  // Client-side: only validate public vars
  const result = clientSchema.safeParse(rawEnv);

  if (!result.success) {
    throw new Error(
      `❌ Client env validation failed:\n${formatZodError(result.error)}`,
    );
  }

  return {
    ...result.data,
    NODE_ENV: (process.env.NODE_ENV as Env["NODE_ENV"]) ?? "development",
  } as Env;
}

// ============================================================
// EXPORTS
// ============================================================

export const env = validateEnv();

export const isProduction = () => env.NODE_ENV === "production";
export const isDevelopment = () => env.NODE_ENV === "development";
export const isTest = () => env.NODE_ENV === "test";
export const isAIEnabled = () => env.AI_ENABLED === true;
