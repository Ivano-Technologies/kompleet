import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the rate-limit module
vi.mock('./rate-limit', () => ({
  rateLimit: vi.fn(),
  getIdentifier: vi.fn(() => '127.0.0.1'),
}));

import { withRateLimit } from './with-rate-limit';
import { rateLimit, getIdentifier } from './rate-limit';
import { NextRequest } from 'next/server';

const mockedRateLimit = vi.mocked(rateLimit);
const mockedGetIdentifier = vi.mocked(getIdentifier);

function createMockRequest(url = 'http://localhost/api/test'): NextRequest {
  return new NextRequest(url);
}

describe('withRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the handler when rate limit is not exceeded', async () => {
    mockedRateLimit.mockReturnValue({
      success: true,
      remaining: 59,
      reset: new Date(Date.now() + 60000),
    });

    const handler = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const wrappedHandler = withRateLimit(handler);
    const request = createMockRequest();
    const response = await wrappedHandler(request);

    expect(handler).toHaveBeenCalledWith(request, undefined);
    expect(response.status).toBe(200);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockedRateLimit.mockReturnValue({
      success: false,
      remaining: 0,
      reset: new Date(Date.now() + 30000),
    });

    const handler = vi.fn();
    const wrappedHandler = withRateLimit(handler);
    const response = await wrappedHandler(createMockRequest());

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(429);

    const body = await response.json();
    expect(body.error).toBe('Too many requests');
  });

  it('sets rate limit headers on successful responses', async () => {
    mockedRateLimit.mockReturnValue({
      success: true,
      remaining: 45,
      reset: new Date('2025-01-01T00:00:00Z'),
    });

    const handler = vi.fn().mockResolvedValue(
      new Response('OK', { status: 200 })
    );

    const wrappedHandler = withRateLimit(handler, { limit: 60 });
    const response = await wrappedHandler(createMockRequest());

    expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('45');
  });

  it('passes custom options to rateLimit', async () => {
    mockedRateLimit.mockReturnValue({
      success: true,
      remaining: 4,
      reset: new Date(Date.now() + 60000),
    });

    const handler = vi.fn().mockResolvedValue(new Response('OK'));
    const wrappedHandler = withRateLimit(handler, { limit: 5, window: 30000 });
    await wrappedHandler(createMockRequest());

    expect(mockedRateLimit).toHaveBeenCalledWith('127.0.0.1', { limit: 5, window: 30000 });
  });

  it('includes Retry-After header on 429 responses', async () => {
    const resetTime = new Date(Date.now() + 45000);
    mockedRateLimit.mockReturnValue({
      success: false,
      remaining: 0,
      reset: resetTime,
    });

    const handler = vi.fn();
    const wrappedHandler = withRateLimit(handler);
    const response = await wrappedHandler(createMockRequest());

    const retryAfter = response.headers.get('Retry-After');
    expect(retryAfter).toBeTruthy();
    expect(Number(retryAfter)).toBeGreaterThan(0);
  });

  it('passes context to handler', async () => {
    mockedRateLimit.mockReturnValue({
      success: true,
      remaining: 59,
      reset: new Date(Date.now() + 60000),
    });

    const handler = vi.fn().mockResolvedValue(new Response('OK'));
    const context = { params: { id: '123' } };

    const wrappedHandler = withRateLimit(handler);
    await wrappedHandler(createMockRequest(), context);

    expect(handler).toHaveBeenCalledWith(expect.any(NextRequest), context);
  });
});
