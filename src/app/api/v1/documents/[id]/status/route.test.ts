/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireAuthedConvex,
  cookies,
  getDocumentStatus,
  withRateLimitImpl,
} = vi.hoisted(() => ({
  requireAuthedConvex: vi.fn(),
  cookies: vi.fn(async () => ({})),
  getDocumentStatus: vi.fn(),
  withRateLimitImpl: vi.fn(<T,>(handler: T) => handler),
}));

vi.mock("next/headers", () => ({
  cookies: () => cookies(),
}));

vi.mock("@/lib/convex/server", () => ({
  requireAuthedConvex: (...args: unknown[]) => requireAuthedConvex(...args),
  isUnauthorized: (error: unknown) =>
    error instanceof Error && error.name === "ConvexUnauthorizedError",
}));

vi.mock("@/modules/document-intelligence", () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "NotFoundError";
    }
  },
  getDocumentControllerWithConvex: () => ({
    getDocumentStatus: (...args: unknown[]) => getDocumentStatus(...args),
  }),
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: <T,>(handler: T) => withRateLimitImpl(handler),
}));

import { GET } from "./route";
import { NotFoundError } from "@/modules/document-intelligence";

function request(id = "doc-1") {
  return new NextRequest(`http://localhost/api/v1/documents/${id}/status`);
}

describe("GET /api/v1/documents/[id]/status", () => {
  beforeEach(() => {
    requireAuthedConvex.mockReset();
    getDocumentStatus.mockReset();
    cookies.mockClear();
    withRateLimitImpl.mockImplementation(<T,>(handler: T) => handler);
  });

  it("returns 401 when Convex auth is missing", async () => {
    const err = Object.assign(new Error("Unauthorized"), {
      name: "ConvexUnauthorizedError",
    });
    requireAuthedConvex.mockRejectedValue(err);
    const res = await GET(request(), { params: Promise.resolve({ id: "doc-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns document status from Convex", async () => {
    requireAuthedConvex.mockResolvedValue({
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
    requireAuthedConvex.mockResolvedValue({
      user: { id: "user-1" },
      convex: {},
    });
    getDocumentStatus.mockRejectedValue(new NotFoundError("Document not found."));
    const res = await GET(request(), { params: Promise.resolve({ id: "missing" }) });
    expect(res.status).toBe(404);
  });
});
