/**
 * Rate limiter. Uses @upstash/ratelimit (Redis REST) when
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 * Falls back to a per-instance in-memory map otherwise — app behaviour is
 * unchanged when those vars are absent.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  limit?: number; // requests per window
  window?: number; // window duration in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: Date;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const upstashLimiters = new Map<string, Ratelimit>();
let upstashRedis: Redis | null = null;

setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

export function upstashRateLimitConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

function getUpstashRedis(): Redis | null {
  if (!upstashRateLimitConfigured()) {
    return null;
  }
  if (!upstashRedis) {
    upstashRedis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL as string,
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
    });
  }
  return upstashRedis;
}

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getUpstashRedis();
  if (!redis) {
    return null;
  }
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const cacheKey = `${limit}:${windowSec}`;
  const cached = upstashLimiters.get(cacheKey);
  if (cached) {
    return cached;
  }
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: "kompleet:rl",
    analytics: false,
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

async function rateLimitUpstash(
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(limit, windowMs);
  if (!limiter) {
    return rateLimit(identifier, { limit, window: windowMs });
  }

  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: new Date(result.reset),
  };
}

/**
 * Shared-store rate limit when Upstash is configured; otherwise in-memory.
 */
export async function rateLimitAsync(
  identifier: string,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const limit =
    options.limit ??
    parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE ?? "60", 10);
  const window = options.window ?? 60 * 1000;
  if (upstashRateLimitConfigured()) {
    try {
      return await rateLimitUpstash(identifier, limit, window);
    } catch {
      return rateLimit(identifier, options);
    }
  }
  return rateLimit(identifier, options);
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {},
): RateLimitResult {
  const limit =
    options.limit ??
    parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE ?? "60", 10);
  const window = options.window ?? 60 * 1000;
  const now = Date.now();

  let entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + window,
    };
    rateLimitStore.set(identifier, entry);

    return {
      success: true,
      remaining: limit - 1,
      reset: new Date(entry.resetTime),
    };
  }

  entry.count++;

  if (entry.count > limit) {
    return {
      success: false,
      remaining: 0,
      reset: new Date(entry.resetTime),
    };
  }

  return {
    success: true,
    remaining: limit - entry.count,
    reset: new Date(entry.resetTime),
  };
}

/**
 * Get identifier from request (IP address).
 *
 * Priority:
 * 1. IP address from x-forwarded-for
 * 2. x-real-ip
 * 3. Fallback to "anonymous"
 */
export function getIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : (request.headers.get("x-real-ip") ?? "anonymous");

  return ip;
}
