import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit } from "../src/lib/rate-limit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    // Note: In a real test environment, you'd want to clear the rate limit store
    // For now, we'll use unique identifiers per test
  });

  it("should allow requests under the limit", () => {
    const identifier = `test-user-${Date.now()}`;

    // First request should succeed
    const result = rateLimit(identifier, { limit: 10, window: 60000 });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(9); // 10 - 1 = 9
    expect(result.reset).toBeInstanceOf(Date);
  });

  it("should block requests over the limit", () => {
    const identifier = `test-user-${Date.now()}-2`;
    const limit = 5;

    // Make requests up to the limit
    for (let i = 0; i < limit; i++) {
      const result = rateLimit(identifier, { limit, window: 60000 });
      expect(result.success).toBe(true);
    }

    // The next request should be blocked
    const blockedResult = rateLimit(identifier, { limit, window: 60000 });
    expect(blockedResult.success).toBe(false);
    expect(blockedResult.remaining).toBe(0);
  });

  it("should return correct remaining count", () => {
    const identifier = `test-user-${Date.now()}-3`;
    const limit = 10;

    // First request: 9 remaining
    let result = rateLimit(identifier, { limit, window: 60000 });
    expect(result.remaining).toBe(9);

    // Second request: 8 remaining
    result = rateLimit(identifier, { limit, window: 60000 });
    expect(result.remaining).toBe(8);

    // Third request: 7 remaining
    result = rateLimit(identifier, { limit, window: 60000 });
    expect(result.remaining).toBe(7);
  });

  it("should use default limit from environment variable", () => {
    const identifier = `test-user-${Date.now()}-4`;

    // Default limit should be 60 (from RATE_LIMIT_REQUESTS_PER_MINUTE)
    const result = rateLimit(identifier);
    expect(result.success).toBe(true);
    // Remaining should be 59 (60 - 1)
    expect(result.remaining).toBeGreaterThanOrEqual(59);
  });

  it("should reset after the window expires", () => {
    const identifier = `test-user-${Date.now()}-5`;
    const limit = 2;
    const window = 100; // 100ms window for faster test

    // Make 2 requests to hit the limit
    rateLimit(identifier, { limit, window });
    rateLimit(identifier, { limit, window });

    // Third request should be blocked
    let result = rateLimit(identifier, { limit, window });
    expect(result.success).toBe(false);

    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // After window expires, requests should be allowed again
        result = rateLimit(identifier, { limit, window });
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(1);
        resolve();
      }, 150); // Wait longer than window
    });
  });

  it("should include reset timestamp", () => {
    const identifier = `test-user-${Date.now()}-6`;

    const result = rateLimit(identifier, { limit: 10, window: 60000 });

    expect(result.reset).toBeInstanceOf(Date);
    // Reset time should be in the future
    expect(result.reset.getTime()).toBeGreaterThan(Date.now());
    // Reset time should be within the window
    expect(result.reset.getTime()).toBeLessThanOrEqual(Date.now() + 60000);
  });
});
