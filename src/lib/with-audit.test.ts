import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { withAudit } from './with-audit';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockInsert = vi.fn().mockReturnValue({
  then: (cb: any) => {
    cb?.();
    return { catch: vi.fn() };
  },
});

const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: 'user-123' } },
});

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: (...args: any[]) => mockFrom(...args),
  }),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(overrides: RequestInit = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'vitest',
    },
    ...overrides,
  });
}

function okResponse(body: Record<string, unknown> = { ok: true }): Response {
  return Response.json(body, { status: 200 });
}

function errorResponse(
  status: number,
  body: Record<string, unknown> = { error: 'fail' },
): Response {
  return Response.json(body, { status });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('withAudit', () => {
  const auditOptions = { action: 'create', resourceType: 'invoices' };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to successful user lookup by default
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });
  });

  // 1. Calls the handler and returns its response
  it('calls the handler and returns its response unchanged', async () => {
    const body = { id: 'inv-1', total: 5000 };
    const handler = vi.fn().mockResolvedValue(okResponse(body));

    const wrapped = withAudit(handler, auditOptions);
    const response = await wrapped(makeRequest());

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(body);
  });

  // 2. Passes request and context through to handler
  it('passes request and context through to the handler', async () => {
    const handler = vi.fn().mockResolvedValue(okResponse());
    const request = makeRequest();
    const context = { params: { id: '42' } };

    const wrapped = withAudit(handler, auditOptions);
    await wrapped(request, context);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(request, context);
  });

  // 3. Audit insert happens for successful (2xx) responses
  it('inserts an audit log entry for successful responses', async () => {
    const handler = vi.fn().mockResolvedValue(okResponse());

    const wrapped = withAudit(handler, auditOptions);
    await wrapped(makeRequest());

    // Allow microtask queue to flush (fire-and-forget promise)
    await new Promise((r) => setTimeout(r, 0));

    expect(mockFrom).toHaveBeenCalledWith('audit_logs');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        action: 'create',
        resource_type: 'invoices',
        ip_address: '127.0.0.1',
        user_agent: 'vitest',
      }),
    );
  });

  // 4. No audit insert for failed (4xx/5xx) responses
  it('does NOT insert an audit log for 4xx responses', async () => {
    const handler = vi.fn().mockResolvedValue(errorResponse(400));

    const wrapped = withAudit(handler, auditOptions);
    await wrapped(makeRequest());

    await new Promise((r) => setTimeout(r, 0));

    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('does NOT insert an audit log for 5xx responses', async () => {
    const handler = vi.fn().mockResolvedValue(errorResponse(500));

    const wrapped = withAudit(handler, auditOptions);
    await wrapped(makeRequest());

    await new Promise((r) => setTimeout(r, 0));

    expect(mockFrom).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  // 5. Handler errors propagate
  it('propagates errors thrown by the handler', async () => {
    const boom = new Error('handler exploded');
    const handler = vi.fn().mockRejectedValue(boom);

    const wrapped = withAudit(handler, auditOptions);

    await expect(wrapped(makeRequest())).rejects.toThrow('handler exploded');
  });
});
