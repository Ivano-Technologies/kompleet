/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireAuthedConvex,
  cookies,
  uploadDocument,
  withRateLimitImpl,
} = vi.hoisted(() => ({
  requireAuthedConvex: vi.fn(),
  cookies: vi.fn(async () => ({})),
  uploadDocument: vi.fn(),
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
  getDocumentControllerWithConvex: () => ({
    uploadDocument: (...args: unknown[]) => uploadDocument(...args),
  }),
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: <T,>(handler: T) => withRateLimitImpl(handler),
}));

import { POST } from "./route";

function request(body: unknown = { documentType: "invoice", fileUrl: "https://f" }) {
  return new NextRequest("http://localhost/api/v1/documents/upload", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/v1/documents/upload", () => {
  beforeEach(() => {
    requireAuthedConvex.mockReset();
    uploadDocument.mockReset();
    cookies.mockClear();
    withRateLimitImpl.mockImplementation(<T,>(handler: T) => handler);
  });

  it("returns 401 when Convex auth is missing", async () => {
    const err = Object.assign(new Error("Unauthorized"), {
      name: "ConvexUnauthorizedError",
    });
    requireAuthedConvex.mockRejectedValue(err);
    const res = await POST(request());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: "Unauthorized" });
    expect(uploadDocument).not.toHaveBeenCalled();
  });

  it("queues a document on Convex and returns 202", async () => {
    requireAuthedConvex.mockResolvedValue({
      user: { id: "user-1" },
      convex: {},
    });
    uploadDocument.mockResolvedValue({ documentId: "doc-1", status: "queued" });
    const res = await POST(request());
    expect(res.status).toBe(202);
    await expect(res.json()).resolves.toEqual({
      documentId: "doc-1",
      status: "queued",
    });
    expect(uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
    );
  });

  it("rethrows Next.js cookies() control-flow errors", async () => {
    const postpone = Object.assign(new Error("Dynamic server usage: cookies"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    cookies.mockRejectedValue(postpone);
    await expect(POST(request())).rejects.toMatchObject({
      digest: "DYNAMIC_SERVER_USAGE",
    });
  });
});
