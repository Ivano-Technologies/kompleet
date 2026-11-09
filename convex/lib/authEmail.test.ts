/** @vitest-environment node */

import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAuthOtp, generateNumericCode } from "./authEmail";

describe("generateNumericCode", () => {
  it("returns the requested number of digits", () => {
    expect(generateNumericCode(8)).toMatch(/^\d{8}$/);
  });
});

describe("generateAuthOtp", () => {
  afterEach(() => {
    delete process.env.AUTH_E2E_OTP;
    delete process.env.AUTH_RESEND_KEY;
    delete process.env.RESEND_API_KEY;
    vi.unstubAllEnvs();
  });

  it("uses AUTH_E2E_OTP when Resend is unset", () => {
    process.env.AUTH_E2E_OTP = "42424242";
    delete process.env.AUTH_RESEND_KEY;
    delete process.env.RESEND_API_KEY;
    expect(generateAuthOtp()).toBe("42424242");
  });

  it("ignores AUTH_E2E_OTP when a Resend key is set", () => {
    process.env.AUTH_E2E_OTP = "42424242";
    process.env.AUTH_RESEND_KEY = "re_test";
    expect(generateAuthOtp()).not.toBe("42424242");
    expect(generateAuthOtp()).toMatch(/^\d{8}$/);
  });
});
