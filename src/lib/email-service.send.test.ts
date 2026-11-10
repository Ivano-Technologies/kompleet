/** @vitest-environment node */

import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./email-service";

describe("sendEmail", () => {
  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.AUTH_RESEND_KEY;
    vi.unstubAllGlobals();
  });

  it("does not hit the network when RESEND_API_KEY is unset", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.AUTH_RESEND_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const sent = await sendEmail(
      "ada@x.com",
      {
        subject: "Invoice INV-001 from Test Traders Ltd",
        text: "Invoice INV-001 for ₦80,625.00 from Test Traders Ltd is ready.",
        html: "<p>Invoice INV-001</p>",
      },
      [{ filename: "INV-001.pdf", content: "Zg==" }],
      "owner@fixture.test",
    );
    expect(sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sets replyTo on the Resend payload when the owner email is valid", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const sent = await sendEmail(
      "ada@x.com",
      {
        subject: "Invoice INV-001 from Test Traders Ltd",
        text: "Invoice INV-001 for ₦80,625.00 from Test Traders Ltd is ready. Reply to this email if you have questions.",
        html: "<p>Invoice INV-001</p>",
      },
      undefined,
      "owner@fixture.test\r\n",
    );
    expect(sent).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body)) as { replyTo?: string };
    expect(payload.replyTo).toBe("owner@fixture.test");
  });

  it("omits replyTo when the owner email is invalid after stripping CR/LF", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const sent = await sendEmail(
      "ada@x.com",
      {
        subject: "Invoice INV-001 from Test Traders Ltd",
        text: "Invoice INV-001 for ₦80,625.00 from Test Traders Ltd is ready.",
        html: "<p>Invoice INV-001</p>",
      },
      undefined,
      "owner@fixture.test\r\nBcc: evil@x.com",
    );
    expect(sent).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(String(init.body)) as { replyTo?: string };
    expect(payload.replyTo).toBeUndefined();
  });
});
