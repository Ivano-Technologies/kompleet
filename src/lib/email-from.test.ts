import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_EMAIL_FROM, getEmailFrom } from "./email-from";

describe("getEmailFrom", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to the verified techivano.com sender", () => {
    vi.stubEnv("CONTACT_EMAIL_FROM", "");
    vi.stubEnv("AUTH_EMAIL_FROM", "");
    expect(getEmailFrom()).toBe(DEFAULT_EMAIL_FROM);
    expect(DEFAULT_EMAIL_FROM).toBe("Kompleet <noreply@techivano.com>");
  });

  it("prefers CONTACT_EMAIL_FROM, then AUTH_EMAIL_FROM", () => {
    vi.stubEnv("CONTACT_EMAIL_FROM", "");
    vi.stubEnv("AUTH_EMAIL_FROM", "Auth <noreply@techivano.com>");
    expect(getEmailFrom()).toBe("Auth <noreply@techivano.com>");
    vi.stubEnv("CONTACT_EMAIL_FROM", "Contact <noreply@techivano.com>");
    expect(getEmailFrom()).toBe("Contact <noreply@techivano.com>");
  });
});
