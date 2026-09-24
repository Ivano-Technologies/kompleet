/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const convexAuthNextjsToken = vi.fn();

vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsToken: (...args: unknown[]) => convexAuthNextjsToken(...args),
}));

vi.mock("@/lib/convex/http", () => ({
  api: { users: { getMine: "users.getMine" } },
  createConvexHttpClient: vi.fn(),
}));

import { getConvexAccessToken } from "./session";

describe("getConvexAccessToken", () => {
  beforeEach(() => {
    convexAuthNextjsToken.mockReset();
  });

  it("returns a Bearer token without touching Convex Auth cookies", async () => {
    const request = new Request("http://localhost/api/tax-reports", {
      headers: { Authorization: "Bearer tok-1" },
    });
    await expect(getConvexAccessToken(request)).resolves.toBe("tok-1");
    expect(convexAuthNextjsToken).not.toHaveBeenCalled();
  });

  it("returns null when Convex Auth has no cookie session", async () => {
    convexAuthNextjsToken.mockResolvedValue(null);
    await expect(getConvexAccessToken()).resolves.toBeNull();
  });

  it("rethrows Next.js cookies() control-flow errors instead of returning null", async () => {
    const postpone = Object.assign(new Error("Dynamic server usage: cookies"), {
      digest: "DYNAMIC_SERVER_USAGE",
    });
    convexAuthNextjsToken.mockRejectedValue(postpone);
    await expect(getConvexAccessToken()).rejects.toBe(postpone);
  });
});
