/**
 * In-memory rate limiter using sliding window algorithm
 *
 * For production with multiple servers, consider:
 * - Upstash Redis (@upstash/ratelimit)
 * - Vercel KV
 * - Redis with ioredis
 */

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

// In-memory store (single server only)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
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

/**
 * Rate limit a request by identifier (user ID or IP address)
 *
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param options - Rate limit configuration
 * @returns Rate limit result with success flag, remaining requests, and reset time
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {},
): RateLimitResult {
  const limit =
    options.limit ??
    parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE ?? "60", 10);
  const window = options.window ?? 60 * 1000; // default 1 minute
  const now = Date.now();

  // Get or create entry
  let entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetTime < now) {
    // Create new entry
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

  // Increment counter
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
 * Get identifier from request (user ID or IP address)
 *
 * Priority:
 * 1. User ID from auth token
 * 2. IP address from headers
 * 3. Fallback to "anonymous"
 */
export function getIdentifier(request: Request): string {
  // Try to get user ID from auth header (implement based on your auth system)
  // For now, use IP address as fallback
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]
    : (request.headers.get("x-real-ip") ?? "anonymous");

  return ip;
}
