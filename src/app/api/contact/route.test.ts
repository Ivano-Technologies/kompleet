/** @vitest-environment node */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { withRateLimitImpl } = vi.hoisted(() => ({
  withRateLimitImpl: vi.fn(<T,>(handler: T) => handler),
}));

vi.mock("@/lib/with-rate-limit", () => ({
  withRateLimit: <T,>(handler: T) => withRateLimitImpl(handler),
}));

import { POST } from "./route";

function contactRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact staff email", () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFetch = globalThis.fetch;
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    process.env.RESEND_API_KEY = "re_test";
    withRateLimitImpl.mockImplementation(<T,>(handler: T) => handler);
  });

  afterEach(() => {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previousKey;
    }
  });

  it("HTML-escapes name, email, and message in the staff notification", async () => {
    const res = await POST(
      contactRequest({
        name: `Ada <img src=x onerror=alert(1)>`,
        email: `ada+"<script>"@example.com`,
        subject: "general",
        message: `Hello & <b>there</b> "quoted" 'text'`,
      }),
    );
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body)) as { html: string };
    expect(payload.html).toContain(
      "Ada &lt;img src=x onerror=alert(1)&gt;",
    );
    expect(payload.html).toContain(
      "ada+&quot;&lt;script&gt;&quot;@example.com",
    );
    expect(payload.html).toContain(
      "Hello &amp; &lt;b&gt;there&lt;/b&gt; &quot;quoted&quot; &#39;text&#39;",
    );
    expect(payload.html).not.toMatch(/<img src=x/);
    expect(payload.html).not.toMatch(/<script>/);
    expect(payload.html).not.toMatch(/<b>there<\/b>/);
  });
});
