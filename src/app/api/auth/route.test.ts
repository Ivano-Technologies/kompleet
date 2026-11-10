import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConvexError } from "convex/values";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_ERROR_CODES } from "../../../../convex/lib/authErrors";

const { fetchAction } = vi.hoisted(() => ({
  fetchAction: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("convex/nextjs", () => ({
  fetchAction,
  fetchQuery: vi.fn(),
}));

import { GET, POST } from "./route";

const authDir = path.dirname(fileURLToPath(import.meta.url));

function prodRedactedConvexError(data: unknown): ConvexError<string> {
  const error = new ConvexError("[Request ID: 7f3a9c1e2b] Server Error");
  (error as { data: unknown }).data = data;
  return error;
}

describe("POST /api/auth route", () => {
  beforeEach(() => {
    fetchAction.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchAction.mockResolvedValue({
      tokens: { token: "test-token", refreshToken: "dummy" },
    });
  });

  it("returns Convex Auth JSON instead of HTML", async () => {
    const request = new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "auth:signIn",
        args: { email: "a@b.c", password: "secret1", flow: "signUp" },
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
    const body = (await response.json()) as {
      tokens?: { token?: string };
    };
    expect(body.tokens?.token).toBe("test-token");
    const raw = JSON.stringify(body);
    expect(raw.startsWith("<")).toBe(false);
    expect(raw).not.toContain("<!DOCTYPE");
  });

  it("does not treat GET as an HTML page", async () => {
    const request = new Request("http://localhost/api/auth", {
      method: "GET",
    });
    const response = await GET(request as never);
    expect(response.status).toBe(405);
    const text = await response.text();
    expect(text.startsWith("<")).toBe(false);
    expect(text).not.toContain("<!DOCTYPE");
  });

  it("is an exact route.ts, not a catch-all that would steal subroutes", () => {
    expect(existsSync(path.join(authDir, "route.ts"))).toBe(true);
    const names = readdirSync(authDir);
    expect(names.some((name) => name.includes("[..."))).toBe(false);
    expect(existsSync(path.join(authDir, "ensure-profile/route.ts"))).toBe(true);
    expect(existsSync(path.join(authDir, "login/route.ts"))).toBe(true);
    expect(existsSync(path.join(authDir, "profile/route.ts"))).toBe(true);
  });

  it("returns 400 for an empty body instead of 500", async () => {
    const request = new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "",
    });
    const response = await POST(request as never);
    expect(fetchAction).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Invalid request");
    expect(JSON.stringify(body)).not.toMatch(/Request ID|stack|SyntaxError/);
  });

  it("returns 400 for malformed JSON instead of 500", async () => {
    const request = new Request("http://localhost/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    const response = await POST(request as never);
    expect(fetchAction).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Invalid request");
  });

  it("forwards every auth mapper code from prod-redacted ConvexError.data", async () => {
    const cases: Array<{ data: object; extra?: string }> = [
      { data: { code: AUTH_ERROR_CODES.INVALID_CREDENTIALS } },
      { data: { code: AUTH_ERROR_CODES.ACCOUNT_EXISTS } },
      { data: { code: AUTH_ERROR_CODES.INVALID_CODE } },
      { data: { code: AUTH_ERROR_CODES.EXPIRED_CODE } },
      {
        data: {
          code: AUTH_ERROR_CODES.TOO_MANY_ATTEMPTS,
          retryAfterSeconds: 3600,
        },
      },
      {
        data: {
          code: AUTH_ERROR_CODES.RATE_LIMITED,
          retryAfterSeconds: 47,
        },
      },
    ];
    for (const { data } of cases) {
      fetchAction.mockRejectedValueOnce(prodRedactedConvexError(data));
      const response = await POST(
        new Request("http://localhost/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "auth:signIn",
            args: { email: "user@example.com", flow: "signIn" },
          }),
        }) as never,
      );
      expect(response.status).toBe(400);
      const body = (await response.json()) as { error: string; code?: string };
      expect(JSON.parse(body.error)).toEqual(data);
      expect(body.code).toBe((data as { code: string }).code);
      expect(JSON.stringify(body)).not.toMatch(/Request ID|Server Error|user@example/);
    }
  });
});
