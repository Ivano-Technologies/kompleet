import { describe, expect, it } from "vitest";
import {
  sanitizeAuthProxyErrorMessage,
  sanitizeAuthProxyResponse,
} from "@/lib/auth/sanitize-proxy-error";

const proxied =
  `[Request ID: 7f3a9c1e2b] Server Error\nUncaught ConvexError: {"code":"ACCOUNT_EXISTS"}\n    at throwAuthError (../../convex/lib/authErrors.ts:98:9)`;

describe("sanitizeAuthProxyErrorMessage", () => {
  it("strips server stack frames and keeps the ConvexError JSON", () => {
    const out = sanitizeAuthProxyErrorMessage(proxied);
    expect(out).toContain('Uncaught ConvexError: {"code":"ACCOUNT_EXISTS"}');
    expect(out).not.toMatch(/\bat\s+/);
  });
});

describe("sanitizeAuthProxyResponse", () => {
  it("rewrites a 400 proxy JSON body so the browser never sees a stack", async () => {
    const response = await sanitizeAuthProxyResponse(
      new Response(JSON.stringify({ error: proxied }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toContain('Uncaught ConvexError: {"code":"ACCOUNT_EXISTS"}');
    expect(body.error).not.toMatch(/\bat\s+/);
  });

  it("leaves success responses unchanged", async () => {
    const original = new Response(JSON.stringify({ tokens: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const out = await sanitizeAuthProxyResponse(original);
    expect(out).toBe(original);
  });
});
