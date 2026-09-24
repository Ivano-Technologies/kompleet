/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  requireAuthedConvex,
  cookies,
  ingestStatement,
  withRateLimitImpl,
} = vi.hoisted(() => ({
  requireAuthedConvex: vi.fn(),
  cookies: vi.fn(async () => ({})),
  ingestStatement: vi.fn(),
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

vi.mock("@/lib/ingestion/ingestionWorker", () => ({
  ingestStatement: (...args: unknown[]) => ingestStatement(...args),
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: <T,>(handler: T) => withRateLimitImpl(handler),
}));

import { POST } from "./route";

function request(file?: File) {
  const form = new FormData();
  if (file) form.append("file", file);
  return new NextRequest("http://localhost/api/ingest", {
    method: "POST",
    body: form,
  });
}

describe("POST /api/ingest", () => {
  beforeEach(() => {
    requireAuthedConvex.mockReset();
    ingestStatement.mockReset();
    cookies.mockClear();
    withRateLimitImpl.mockImplementation(<T,>(handler: T) => handler);
  });

  it("returns 401 when Convex auth is missing", async () => {
    const err = Object.assign(new Error("Unauthorized"), {
      name: "ConvexUnauthorizedError",
    });
    requireAuthedConvex.mockRejectedValue(err);
    const res = await POST(request(new File(["a"], "a.csv")));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ success: false });
    expect(ingestStatement).not.toHaveBeenCalled();
  });

  it("returns 400 when no file is provided", async () => {
    requireAuthedConvex.mockResolvedValue({ user: { id: "user-1" } });
    const res = await POST(request());
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      message: "No file provided",
    });
  });

  it("parses a statement without persisting to Supabase", async () => {
    requireAuthedConvex.mockResolvedValue({ user: { id: "user-1" } });
    ingestStatement.mockResolvedValue({
      success: true,
      transactionCount: 2,
      message: "ok",
    });
    const res = await POST(request(new File(["csv"], "stmt.csv")));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      success: true,
      transactionCount: 2,
      message: "ok",
    });
    expect(ingestStatement).toHaveBeenCalledWith(
      expect.objectContaining({ file: expect.any(File) }),
      "user-1",
      expect.any(String),
    );
  });

  it("rethrows Next.js cookies() control-flow errors", async () => {
    const postpone = Object.assign(new Error("Dynamic server usage: cookies"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    cookies.mockRejectedValue(postpone);
    await expect(POST(request(new File(["a"], "a.csv")))).rejects.toMatchObject({
      digest: "DYNAMIC_SERVER_USAGE",
    });
  });
});
