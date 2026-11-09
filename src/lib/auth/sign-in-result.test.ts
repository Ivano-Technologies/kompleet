import { describe, expect, it } from "vitest";
import { didSignInComplete, verifyEmailPath } from "./sign-in-result";

describe("didSignInComplete", () => {
  it("reads Convex Auth signingIn", () => {
    expect(didSignInComplete({ signingIn: true })).toBe(true);
    expect(didSignInComplete({ signingIn: false })).toBe(false);
  });

  it("treats a bare boolean as the legacy return", () => {
    expect(didSignInComplete(true)).toBe(true);
    expect(didSignInComplete(false)).toBe(false);
  });
});

describe("verifyEmailPath", () => {
  it("normalises the email query", () => {
    expect(verifyEmailPath("  Ada@Example.COM ")).toBe(
      "/verify-email?email=ada%40example.com",
    );
  });
});
