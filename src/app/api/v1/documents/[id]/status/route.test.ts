/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  getAuthedConvex,
  cookies,
  getDocumentStatus,
  getDocumentStatusControllerWithConvex,
  withRateLimitImpl,
  NotFoundError,
} = vi.hoisted(() => {
  class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "NotFoundError";
    }
  }
  return {
    getAuthedConvex: vi.fn(),
    cookies: vi.fn(async () => ({})),
    getDocumentStatus: vi.fn(),
    getDocumentStatusControllerWithConvex: vi.fn(),
    withRateLimitImpl: vi.fn(<T,>(handler: T) => handler),
    NotFoundError,
  };
});

vi.mock("next/headers", () => ({
  cookies: () => cookies(),
}));

vi.mock("@/lib/convex/server", () => ({
  getAuthedConvex: (...args: unknown[]) => getAuthedConvex(...args),
  isUnauthorized: (error: unknown) =>
    error instanceof Error &&
    /unauthorized|authentication required/i.test(error.message),
}));

vi.mock("@/modules/document-intelligence", () => ({
  NotFoundError,
  getDocumentStatusControllerWithConvex: (...args: unknown[]) =>
    getDocumentStatusControllerWithConvex(...args),
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: <T,>(handler: T) => withRateLimitImpl(handler),
}));

import { GET } from "./route";

function request(id = "doc-1") {
  return new NextRequest(`http://localhost/api/v1/documents/${id}/status`);
}

describe("GET /api/v1/documents/[id]/status", () => {
  beforeEach(() => {
    getAuthedConvex.mockReset();
    getDocumentStatus.mockReset();
    getDocumentStatusControllerWithConvex.mockReset();
    getDocumentStatusControllerWithConvex.mockImplementation(() => ({
      getDocumentStatus: (...args: unknown[]) => getDocumentStatus(...args),
    }));
    cookies.mockReset();
    cookies.mockResolvedValue({});
    withRateLimitImpl.mockImplementation(<T,>(handler: T) => handler);
  });

  it("returns 401 when Convex auth is missing and never builds a controller", async () => {
    getAuthedConvex.mockResolvedValue(null);
    getDocumentStatusControllerWithConvex.mockImplementation(() => {
      throw new Error("REDIS_URL is required for document queueing.");
    });
    const res = await GET(request(), { params: Promise.resolve({ id: "doc-1" }) });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: "Unauthorized" });
    expect(getDocumentStatusControllerWithConvex).not.toHaveBeenCalled();
    expect(getDocumentStatus).not.toHaveBeenCalled();
  });

  it("does not map an unauthenticated miss to HTTP 500", async () => {
    getAuthedConvex.mockResolvedValue(null);
    const res = await GET(request(), { params: Promise.resolve({ id: "doc-1" }) });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.not.toMatchObject({
      error: "Internal server error",
    });
  });

  it("returns document status from Convex without requiring Redis", async () => {
    getAuthedConvex.mockResolvedValue({
      user: { id: "user-1" },
      convex: {},
    });
    getDocumentStatus.mockResolvedValue({
      documentId: "doc-1",
      status: "completed",
      confidenceScore: 91,
      structuredData: { total: 10 },
    });
    const res = await GET(request(), { params: Promise.resolve({ id: "doc-1" }) });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      documentId: "doc-1",
      status: "completed",
      confidenceScore: 91,
      structuredData: { total: 10 },
    });
  });

  it("returns 404 when the document is missing", async () => {
    getAuthedConvex.mockResolvedValue({
      user: { id: "user-1" },
      convex: {},
    });
    getDocumentStatus.mockRejectedValue(new NotFoundError("Document not found."));
    const res = await GET(request(), { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });

  it("rethrows Next.js cookies() control-flow errors", async () => {
    const postpone = Object.assign(new Error("Dynamic server usage: cookies"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    cookies.mockRejectedValue(postpone);
    await expect(
      GET(request(), { params: Promise.resolve({ id: "doc-1" }) }),
    ).rejects.toMatchObject({
      digest: "DYNAMIC_SERVER_USAGE",
    });
    expect(getAuthedConvex).not.toHaveBeenCalled();
    expect(getDocumentStatusControllerWithConvex).not.toHaveBeenCalled();
  });
});
