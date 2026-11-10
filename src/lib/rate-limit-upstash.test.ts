import { afterEach, describe, expect, it, vi } from "vitest";

describe("rateLimitAsync with @upstash/ratelimit", () => {
  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.resetModules();
    vi.doUnmock("@upstash/ratelimit");
    vi.doUnmock("@upstash/redis");
    vi.useRealTimers();
  });

  it("uses @upstash/ratelimit.limit when Redis env is set", async () => {
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "upstash-token";

    const limitMock = vi.fn().mockResolvedValue({
      success: true,
      remaining: 3,
      reset: Date.now() + 5_000,
      limit: 5,
      pending: Promise.resolve(),
    });

    vi.doMock("@upstash/redis", () => ({
      Redis: class Redis {
        constructor(_opts: unknown) {}
      },
    }));
    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: class Ratelimit {
        static slidingWindow(limit: number, window: string) {
          return { limit, window };
        }
        limit = limitMock;
        constructor(_opts: unknown) {}
      },
    }));

    const { rateLimitAsync, upstashRateLimitConfigured } = await import(
      "./rate-limit"
    );
    expect(upstashRateLimitConfigured()).toBe(true);

    const result = await rateLimitAsync("203.0.113.50", {
      limit: 5,
      window: 60_000,
    });
    expect(limitMock).toHaveBeenCalledWith("203.0.113.50");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(3);
    expect(result.reset).toBeInstanceOf(Date);
  });

  it("falls back to in-memory when Upstash throws", async () => {
    vi.resetModules();
    vi.useFakeTimers();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "upstash-token";

    vi.doMock("@upstash/redis", () => ({
      Redis: class Redis {
        constructor(_opts: unknown) {}
      },
    }));
    vi.doMock("@upstash/ratelimit", () => ({
      Ratelimit: class Ratelimit {
        static slidingWindow(limit: number, window: string) {
          return { limit, window };
        }
        limit = vi.fn().mockRejectedValue(new Error("redis down"));
        constructor(_opts: unknown) {}
      },
    }));

    const { rateLimitAsync } = await import("./rate-limit");
    const first = await rateLimitAsync("fallback-user", {
      limit: 1,
      window: 60_000,
    });
    const second = await rateLimitAsync("fallback-user", {
      limit: 1,
      window: 60_000,
    });
    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
  });

  it("reports unconfigured when Redis env is absent", async () => {
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { upstashRateLimitConfigured } = await import("./rate-limit");
    expect(upstashRateLimitConfigured()).toBe(false);
  });
});
