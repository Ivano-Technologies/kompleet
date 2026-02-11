import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getIdentifier } from './rate-limit';

interface RateLimitOptions {
  limit?: number; // requests per window
  window?: number; // window duration in milliseconds
}

/**
 * Higher-order function that adds rate limiting to API route handlers
 *
 * Usage:
 * ```typescript
 * export const POST = withRateLimit(async (request) => {
 *   // Your handler code
 * }, { limit: 10 });
 * ```
 *
 * @param handler - The API route handler function
 * @param options - Rate limit configuration
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T extends Request | NextRequest = Request>(
  handler: (request: T, context?: any) => Promise<Response> | Response,
  options: RateLimitOptions = {}
): (request: T, context?: any) => Promise<Response> {
  return async (request: T, context?: any) => {
    const identifier = getIdentifier(request);
    const result = rateLimit(identifier, options);

    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', String(options.limit ?? 60));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', result.reset.toISOString());

    if (!result.success) {
      const retryAfter = Math.ceil((result.reset.getTime() - Date.now()) / 1000);
      headers.set('Retry-After', String(retryAfter));

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // Execute the handler
    const response = await handler(request, context);

    // Add rate limit headers to successful responses
    const newResponse = new Response(response.body, response);
    headers.forEach((value, key) => {
      newResponse.headers.set(key, value);
    });

    return newResponse;
  };
}
