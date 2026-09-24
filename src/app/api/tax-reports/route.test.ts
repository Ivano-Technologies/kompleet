/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireAuthedConvex = vi.fn();
const isUnauthorized = vi.fn((error: unknown) => {
  return (
    error instanceof Error &&
    /not authenticated|unauthorized/i.test(error.message)
  );
});

vi.mock("@/lib/convex/server", () => ({
  requireAuthedConvex: (...args: unknown[]) => requireAuthedConvex(...args),
  isUnauthorized: (error: unknown) => isUnauthorized(error),
}));

vi.mock("@/lib/convex/http", () => ({
  api: { tax: { listReports: "tax.listReports" } },
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: <T,>(handler: T) => handler,
}));

import { GET } from "./route";

function request(url = "http://localhost/api/tax-reports"): NextRequest {
  return new NextRequest(url);
}

describe("GET /api/tax-reports", () => {
  beforeEach(() => {
    requireAuthedConvex.mockReset();
    isUnauthorized.mockClear();
  });

  it("returns 401 when the session is missing", async () => {
    requireAuthedConvex.mockRejectedValue(new Error("Unauthorized"));
    const res = await GET(request());
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 200 with an empty list and omits undefined Convex args", async () => {
    const query = vi.fn().mockResolvedValue([]);
    requireAuthedConvex.mockResolvedValue({ convex: { query } });
    const res = await GET(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ reports: [] });
    expect(query).toHaveBeenCalledWith("tax.listReports", {});
  });

  it("forwards only defined filters to Convex", async () => {
    const query = vi.fn().mockResolvedValue([{ id: "r1" }]);
    requireAuthedConvex.mockResolvedValue({ convex: { query } });
    const res = await GET(
      request("http://localhost/api/tax-reports?taxYear=2025&status=draft"),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ reports: [{ id: "r1" }] });
    expect(query).toHaveBeenCalledWith("tax.listReports", {
      taxYear: 2025,
      status: "draft",
    });
  });

  it("returns 200 with an empty list when Convex throws a non-auth error", async () => {
    const query = vi.fn().mockRejectedValue(new Error("Table taxReports not found"));
    requireAuthedConvex.mockResolvedValue({ convex: { query } });
    const res = await GET(request());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ reports: [] });
  });
});
