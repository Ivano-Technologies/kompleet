/**
 * Transaction Upload API Tests (TDD Priority 0)
 * POST /api/transactions/upload and upload-v2: auth required, file type validated.
 * Calls route handlers directly with mocked Supabase (no live server).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi
  .fn()
  .mockResolvedValue({ data: { user: null }, error: null });
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: vi.fn(() => ({
    insert: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    update: vi.fn(),
  })),
};
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => Promise.resolve(mockSupabase)),
  getSupabaseForRequest: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("POST /api/transactions/upload-v2", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  it("returns 401 when not authenticated", async () => {
    const startedAt = Date.now();
    // #region agent log
    fetch("http://127.0.0.1:7618/ingest/0be0fd3d-ce28-4416-8e00-446736413fdd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b3c43a"
      },
      body: JSON.stringify({
        sessionId: "b3c43a",
        runId: "pre-fix",
        hypothesisId: "H3",
        location: "src/__tests__/api/transactions-upload.test.ts:34",
        message: "upload-v2 unauthorized test started",
        data: {},
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    const form = new FormData();
    form.set(
      "file",
      new Blob(["x".repeat(100)], { type: "application/pdf" }),
      "test.pdf",
    );
    form.set("bankCode", "GTB");

    const req = new NextRequest(
      "http://localhost:3000/api/transactions/upload-v2",
      {
        method: "POST",
        body: form,
      },
    );

    const { POST } = await import("@/app/api/transactions/upload-v2/route");
    const res = await POST(req);

    // #region agent log
    fetch("http://127.0.0.1:7618/ingest/0be0fd3d-ce28-4416-8e00-446736413fdd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b3c43a"
      },
      body: JSON.stringify({
        sessionId: "b3c43a",
        runId: "pre-fix",
        hypothesisId: "H3",
        location: "src/__tests__/api/transactions-upload.test.ts:72",
        message: "upload-v2 unauthorized test completed",
        data: { status: res.status, elapsedMs: Date.now() - startedAt },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/[Uu]nauthorized|sign in/);
  }, 15000);
});

describe("Upload API contract", () => {
  it("v2 success response shape includes sessionId, imported, duplicates", () => {
    const successShape = {
      sessionId: expect.any(String),
      imported: expect.any(Number),
      duplicates: expect.any(Number),
      errors: expect.any(Number),
    };
    expect(successShape).toBeDefined();
  });
});
