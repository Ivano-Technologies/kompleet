/** @vitest-environment node */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  generateAuthOtp,
  generateNumericCode,
  isE2eOtpStoreEnabled,
} from "./authEmail";

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

  it("returns unique 8 digit codes even when AUTH_E2E_OTP is set", () => {
    process.env.AUTH_E2E_OTP = "42424242";
    delete process.env.AUTH_RESEND_KEY;
    delete process.env.RESEND_API_KEY;
    const first = generateAuthOtp();
    const second = generateAuthOtp();
    expect(first).toMatch(/^\d{8}$/);
    expect(second).toMatch(/^\d{8}$/);
    expect(first).not.toBe(second);
  });

  it("still returns 8 digit codes when a Resend key is set", () => {
    process.env.AUTH_E2E_OTP = "42424242";
    process.env.AUTH_RESEND_KEY = "re_test";
    expect(generateAuthOtp()).toMatch(/^\d{8}$/);
  });
});

describe("isE2eOtpStoreEnabled", () => {
  afterEach(() => {
    delete process.env.AUTH_E2E_OTP;
    delete process.env.AUTH_RESEND_KEY;
    delete process.env.RESEND_API_KEY;
    vi.unstubAllEnvs();
  });

  it("is on only when AUTH_E2E_OTP is 8 digits and Resend is unset", () => {
    process.env.AUTH_E2E_OTP = "42424242";
    delete process.env.AUTH_RESEND_KEY;
    delete process.env.RESEND_API_KEY;
    expect(isE2eOtpStoreEnabled()).toBe(true);
  });

  it("stays off when a Resend key is set", () => {
    process.env.AUTH_E2E_OTP = "42424242";
    process.env.AUTH_RESEND_KEY = "re_test";
    expect(isE2eOtpStoreEnabled()).toBe(false);
  });
});
