import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { RateLimitResult } from './rate-limit';

/**
 * The rate-limit module has a `setInterval` at module scope that runs cleanup
 * every 5 minutes. We must use fake timers before importing the module to
 * intercept that interval, and we re-import the module for each test to get
 * a fresh in-memory store.
 */

describe('Rate Limiter', () => {
  let rateLimit: (
    identifier: string,
    options?: { limit?: number; window?: number }
  ) => { success: boolean; remaining: number; reset: Date };
  let getIdentifier: (request: Request) => string;

  beforeEach(async () => {
    vi.useFakeTimers();
    // Clear the module cache so each test gets a fresh rateLimitStore
    vi.resetModules();
    const mod = await import('./rate-limit');
    rateLimit = mod.rateLimit;
    getIdentifier = mod.getIdentifier;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── Basic request counting ───────────────────────────────────────────────

  describe('basic rate limiting', () => {
    it('should succeed on the first request with remaining = limit - 1', () => {
      const result = rateLimit('user-1', { limit: 10, window: 60_000 });
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should return a reset Date in the future', () => {
      const now = Date.now();
      const result = rateLimit('user-1', { limit: 10, window: 60_000 });
      expect(result.reset).toBeInstanceOf(Date);
      expect(result.reset.getTime()).toBeGreaterThanOrEqual(now);
    });

    it('should succeed for all requests within the limit', () => {
      const limit = 5;
      for (let i = 0; i < limit; i++) {
        const result = rateLimit('user-1', { limit, window: 60_000 });
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(limit - 1 - i);
      }
    });

    it('should decrement remaining with each request', () => {
      const limit = 3;
      const r1 = rateLimit('user-1', { limit, window: 60_000 });
      expect(r1.remaining).toBe(2);

      const r2 = rateLimit('user-1', { limit, window: 60_000 });
      expect(r2.remaining).toBe(1);

      const r3 = rateLimit('user-1', { limit, window: 60_000 });
      expect(r3.remaining).toBe(0);
    });
  });

  // ─── Exceeding the limit ──────────────────────────────────────────────────

  describe('exceeding the limit', () => {
    it('should return success: false when the limit is exceeded', () => {
      const limit = 3;
      // Use up the limit
      for (let i = 0; i < limit; i++) {
        rateLimit('user-1', { limit, window: 60_000 });
      }
      // Next request should be blocked
      const result = rateLimit('user-1', { limit, window: 60_000 });
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should continue blocking after the limit is exceeded', () => {
      const limit = 2;
      rateLimit('user-1', { limit, window: 60_000 });
      rateLimit('user-1', { limit, window: 60_000 });

      // Both subsequent requests should fail
      const r3 = rateLimit('user-1', { limit, window: 60_000 });
      const r4 = rateLimit('user-1', { limit, window: 60_000 });
      expect(r3.success).toBe(false);
      expect(r4.success).toBe(false);
    });
  });

  // ─── Window expiration / counter reset ────────────────────────────────────

  describe('window expiration', () => {
    it('should reset the counter after the window expires', () => {
      const limit = 2;
      const window = 60_000;

      // Exhaust the limit
      rateLimit('user-1', { limit, window });
      rateLimit('user-1', { limit, window });
      const blocked = rateLimit('user-1', { limit, window });
      expect(blocked.success).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(window + 1);

      // Should succeed again with full limit
      const result = rateLimit('user-1', { limit, window });
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(limit - 1);
    });

    it('should not reset the counter before the window expires', () => {
      const limit = 2;
      const window = 60_000;

      rateLimit('user-1', { limit, window });
      rateLimit('user-1', { limit, window });

      // Advance time to just before window expiration
      vi.advanceTimersByTime(window - 1);

      const result = rateLimit('user-1', { limit, window });
      expect(result.success).toBe(false);
    });
  });

  // ─── Identifier independence ──────────────────────────────────────────────

  describe('identifier independence', () => {
    it('should track different identifiers independently', () => {
      const limit = 2;
      const opts = { limit, window: 60_000 };

      // Exhaust user-1's limit
      rateLimit('user-1', opts);
      rateLimit('user-1', opts);
      const blockedUser1 = rateLimit('user-1', opts);
      expect(blockedUser1.success).toBe(false);

      // user-2 should still have full limit
      const user2Result = rateLimit('user-2', opts);
      expect(user2Result.success).toBe(true);
      expect(user2Result.remaining).toBe(limit - 1);
    });

    it('should not cross-contaminate counters between identifiers', () => {
      const limit = 5;
      const opts = { limit, window: 60_000 };

      // Make 3 requests for user-1
      rateLimit('user-1', opts);
      rateLimit('user-1', opts);
      rateLimit('user-1', opts);

      // user-2 first request should show full remaining
      const result = rateLimit('user-2', opts);
      expect(result.remaining).toBe(limit - 1);
    });
  });

  // ─── Default options ──────────────────────────────────────────────────────

  describe('default options', () => {
    it('should use default limit of 60 when RATE_LIMIT_REQUESTS_PER_MINUTE is not set', () => {
      // Ensure the env var is not set
      delete process.env.RATE_LIMIT_REQUESTS_PER_MINUTE;

      const result = rateLimit('user-defaults');
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(59); // 60 - 1
    });

    it('should use default window of 60 seconds', () => {
      delete process.env.RATE_LIMIT_REQUESTS_PER_MINUTE;

      const result = rateLimit('user-window-test');
      // Reset should be ~60 seconds from now
      const now = Date.now();
      const resetMs = result.reset.getTime() - now;
      expect(resetMs).toBeLessThanOrEqual(60_000);
      expect(resetMs).toBeGreaterThan(0);
    });
  });

  // ─── getIdentifier ────────────────────────────────────────────────────────

  describe('getIdentifier', () => {
    it('should extract the first IP from x-forwarded-for header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '203.0.113.50, 70.41.3.18, 150.172.238.178',
        },
      });
      const id = getIdentifier(request);
      expect(id).toBe('203.0.113.50');
    });

    it('should use x-forwarded-for even if it contains a single IP', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '10.0.0.1',
        },
      });
      const id = getIdentifier(request);
      expect(id).toBe('10.0.0.1');
    });

    it('should fall back to x-real-ip if x-forwarded-for is not present', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '192.168.1.100',
        },
      });
      const id = getIdentifier(request);
      expect(id).toBe('192.168.1.100');
    });

    it('should return "anonymous" when no IP headers are present', () => {
      const request = new Request('https://example.com');
      const id = getIdentifier(request);
      expect(id).toBe('anonymous');
    });

    it('should prioritize x-forwarded-for over x-real-ip', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '1.2.3.4',
          'x-real-ip': '5.6.7.8',
        },
      });
      const id = getIdentifier(request);
      expect(id).toBe('1.2.3.4');
    });
  });

  // ─── Cleanup interval ────────────────────────────────────────────────────

  describe('cleanup interval', () => {
    it('should not throw when the cleanup interval fires', () => {
      // Make a request so there is an entry in the store
      rateLimit('cleanup-test', { limit: 5, window: 1_000 });

      // Advance past the window so the entry is stale
      vi.advanceTimersByTime(2_000);

      // Advance to the 5-minute cleanup interval -- should not throw
      expect(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      }).not.toThrow();
    });
  });
});
