import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { withAudit } from "./with-audit";

const mockMutation = vi.fn().mockResolvedValue(null);

vi.mock("@/lib/convex/server", () => ({
  getAuthedConvex: vi.fn(async () => ({
    convex: { mutation: mockMutation },
    user: { id: "user-123" },
    accessToken: "token",
  })),
}));

vi.mock("@/lib/convex/http", () => ({
  api: { audit: { append: "audit.append" } },
}));

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/test", {
    method: "POST",
    headers: {
      "x-forwarded-for": "127.0.0.1",
      "user-agent": "vitest",
    },
  });
}

function okResponse(body: Record<string, unknown> = { ok: true }): Response {
  return Response.json(body, { status: 200 });
}

function errorResponse(
  status: number,
  body: Record<string, unknown> = { error: "fail" },
): Response {
  return Response.json(body, { status });
}

describe("withAudit", () => {
  const auditOptions = { action: "create", resourceType: "invoices" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutation.mockResolvedValue(null);
  });

  it("calls the handler and returns its response unchanged", async () => {
    const body = { id: "inv-1", total: 5000 };
    const handler = vi.fn().mockResolvedValue(okResponse(body));

    const wrapped = withAudit(handler, auditOptions);
    const response = await wrapped(makeRequest());

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(body);
  });

  it("passes request and context through to the handler", async () => {
    const handler = vi.fn().mockResolvedValue(okResponse());
    const request = makeRequest();
    const context = { params: { id: "42" } };

    const wrapped = withAudit(handler, auditOptions);
    await wrapped(request, context);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(request, context);
  });

  it("appends an audit log entry for successful responses", async () => {
    const handler = vi.fn().mockResolvedValue(okResponse());

    const wrapped = withAudit(handler, auditOptions);
    await wrapped(makeRequest());

    await new Promise((r) => setTimeout(r, 0));

    expect(mockMutation).toHaveBeenCalledWith("audit.append", {
      action: "create",
      resourceType: "invoices",
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });
  });

  it("does NOT insert an audit log for 4xx responses", async () => {
    const handler = vi.fn().mockResolvedValue(errorResponse(400));

    const wrapped = withAudit(handler, auditOptions);
    await wrapped(makeRequest());

    await new Promise((r) => setTimeout(r, 0));

    expect(mockMutation).not.toHaveBeenCalled();
  });

  it("does NOT insert an audit log for 5xx responses", async () => {
    const handler = vi.fn().mockResolvedValue(errorResponse(500));

    const wrapped = withAudit(handler, auditOptions);
    await wrapped(makeRequest());

    await new Promise((r) => setTimeout(r, 0));

    expect(mockMutation).not.toHaveBeenCalled();
  });

  it("propagates errors thrown by the handler", async () => {
    const boom = new Error("handler exploded");
    const handler = vi.fn().mockRejectedValue(boom);

    const wrapped = withAudit(handler, auditOptions);

    await expect(wrapped(makeRequest())).rejects.toThrow("handler exploded");
  });
});
