import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

async function locationFor(query: string): Promise<URL> {
  const res = await GET(new NextRequest(`https://kompleet.test/auth/callback${query}`));
  expect(res.status).toBeGreaterThanOrEqual(300);
  expect(res.status).toBeLessThan(400);
  return new URL(res.headers.get("location") ?? "");
}

describe("GET /auth/callback", () => {
  it("sends an expired link to /login?error=expired_link", async () => {
    const url = await locationFor(
      "?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );
    expect(url.pathname).toBe("/login");
    expect(url.search).toBe("?error=expired_link");
  });

  it("sends a leftover code to /login?error=expired_link", async () => {
    const url = await locationFor("?code=abc123");
    expect(url.search).toBe("?error=expired_link");
  });

  it("sends other auth failures to /login?error=auth_failed without raw text", async () => {
    const url = await locationFor(
      "?error=server_error&error_code=unexpected_failure&error_description=Database+exploded",
    );
    expect(url.pathname).toBe("/login");
    expect(url.search).toBe("?error=auth_failed");
  });

  it("sends a bare visit to plain /login", async () => {
    const url = await locationFor("");
    expect(url.pathname).toBe("/login");
    expect(url.search).toBe("");
  });
});
