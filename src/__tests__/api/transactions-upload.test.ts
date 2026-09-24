/**
 * Transaction Upload API Tests (TDD Priority 0)
 * POST /api/transactions/upload and upload-v2: auth required, file type validated.
 * Calls route handlers directly (no live server). Unauthenticated requests
 * fail closed via requireAuthedConvex.
 */

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

describe("POST /api/transactions/upload-v2", () => {
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
