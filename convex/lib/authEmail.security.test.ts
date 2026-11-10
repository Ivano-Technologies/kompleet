/** @vitest-environment node */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  newDeviceNotice,
  passwordChangeNotice,
  sendSecurityEmail,
} from "./authEmail";

describe("security emails", () => {
  afterEach(() => {
    delete process.env.AUTH_RESEND_KEY;
    delete process.env.RESEND_API_KEY;
    vi.unstubAllGlobals();
  });

  it("no-ops when Resend is unset", async () => {
    delete process.env.AUTH_RESEND_KEY;
    delete process.env.RESEND_API_KEY;
    const sent = await sendSecurityEmail({
      email: "ada@example.com",
      purpose: "password-change",
      subject: "x",
      text: "y",
      html: "<p>y</p>",
    });
    expect(sent).toBe(false);
  });

  it("posts to Resend when a key is set", async () => {
    process.env.AUTH_RESEND_KEY = "re_test";
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const notice = passwordChangeNotice("ada@example.com");
    const sent = await sendSecurityEmail({
      email: "ada@example.com",
      purpose: "password-change",
      ...notice,
    });
    expect(sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    const raw = JSON.stringify(fetchMock.mock.calls[0] ?? []);
    expect(raw).toContain("ada@example.com");
    expect(raw).toContain("password");
  });

  it("describes a new device without throwing", () => {
    const notice = newDeviceNotice("ada@example.com", "Firefox");
    expect(notice.text).toContain("Firefox");
    expect(notice.html).toContain("ada@example.com");
  });
});
