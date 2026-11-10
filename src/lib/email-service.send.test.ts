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
    );
    expect(sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
