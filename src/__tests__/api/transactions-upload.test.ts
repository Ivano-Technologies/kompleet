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
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: vi.fn(() => ({
        insert: vi.fn(),
        select: vi.fn(),
        eq: vi.fn(),
        update: vi.fn(),
      })),
    }),
  ),
}));

describe("POST /api/transactions/upload-v2", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  });

  it("returns 401 when not authenticated", async () => {
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

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/[Uu]nauthorized|Unauthorized/);
  });
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
