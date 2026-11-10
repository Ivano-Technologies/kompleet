/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import { AUTH_OTP_LENGTH, isCompleteAuthOtp, sanitiseAuthOtp } from "./authOtp";

describe("sanitiseAuthOtp", () => {
  it("strips whitespace, punctuation and letters, then caps at 8 digits", () => {
    expect(sanitiseAuthOtp("85118942.")).toBe("85118942");
    expect(sanitiseAuthOtp(" 85-118-942 ")).toBe("85118942");
    expect(sanitiseAuthOtp("8511\n8942")).toBe("85118942");
    expect(sanitiseAuthOtp("abc85118942999")).toBe("85118942");
    expect(sanitiseAuthOtp("12 34")).toBe("1234");
    expect(sanitiseAuthOtp("")).toBe("");
    expect(sanitiseAuthOtp(undefined)).toBe("");
    expect(sanitiseAuthOtp(null)).toBe("");
  });

  it("treats only an 8-digit value as complete", () => {
    expect(AUTH_OTP_LENGTH).toBe(8);
    expect(isCompleteAuthOtp("85118942.")).toBe(true);
    expect(isCompleteAuthOtp("8511894")).toBe(false);
  });
});
