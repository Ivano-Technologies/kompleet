/**
 * Unit tests for environment validation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  validateEnv,
  isProduction,
  isDevelopment,
  isTest,
} from "./env-validation";

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it("should pass validation with all required vars", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.STRIPE_SECRET_KEY = "test-stripe-key";
    process.env.STRIPE_WEBHOOK_SECRET = "test-webhook-secret";
    process.env.STRIPE_PRICE_PRO = "price_pro";
    process.env.STRIPE_PRICE_ENTERPRISE = "price_enterprise";

    const result = validateEnv();

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.env.OPENAI_API_KEY).toBe("test-openai-key");
      expect(result.env.STRIPE_SECRET_KEY).toBe("test-stripe-key");
    }
  });

  it("should fail validation with missing required vars", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_PRICE_ENTERPRISE;

    const result = validateEnv();

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((err) => err.includes("OPENAI_API_KEY"))).toBe(
        true,
      );
    }
  });

  it("does not require Supabase env after Phase 5", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.STRIPE_SECRET_KEY = "test-stripe-key";
    process.env.STRIPE_WEBHOOK_SECRET = "test-webhook-secret";
    process.env.STRIPE_PRICE_PRO = "price_pro";
    process.env.STRIPE_PRICE_ENTERPRISE = "price_enterprise";

    const result = validateEnv();

    expect(result.valid).toBe(true);
  });

  it("should detect potentially exposed secrets", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.NEXT_PUBLIC_SECRET_KEY = "exposed-secret"; // Dangerous!
    process.env.OPENAI_API_KEY = "test-openai-key";
    process.env.STRIPE_SECRET_KEY = "test-stripe-key";
    process.env.STRIPE_WEBHOOK_SECRET = "test-webhook-secret";
    process.env.STRIPE_PRICE_PRO = "price_pro";
    process.env.STRIPE_PRICE_ENTERPRISE = "price_enterprise";

    const result = validateEnv();

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(
        result.errors.some((err) => err.includes("NEXT_PUBLIC_SECRET_KEY")),
      ).toBe(true);
    }
  });
});

describe("environment helpers", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
  });

  it("should detect production environment", () => {
    (process.env as any).NODE_ENV = "production";
    expect(isProduction()).toBe(true);
    expect(isDevelopment()).toBe(false);
    expect(isTest()).toBe(false);
  });

  it("should detect development environment", () => {
    (process.env as any).NODE_ENV = "development";
    expect(isProduction()).toBe(false);
    expect(isDevelopment()).toBe(true);
    expect(isTest()).toBe(false);
  });

  it("should detect test environment", () => {
    (process.env as any).NODE_ENV = "test";
    expect(isProduction()).toBe(false);
    expect(isDevelopment()).toBe(false);
    expect(isTest()).toBe(true);
  });
});
