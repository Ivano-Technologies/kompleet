/** @vitest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONVEX_AUTH_DEFAULT_MAX_FAILED_ATTEMPTS_PER_HOUR,
  SIGN_IN_MAX_FAILED_ATTEMPTS_PER_HOUR,
} from "./authLockout";

describe("Convex Auth sign-in lockout", () => {
  it("is stricter than the library default of 10 failed attempts per hour", () => {
    expect(SIGN_IN_MAX_FAILED_ATTEMPTS_PER_HOUR).toBeLessThan(
      CONVEX_AUTH_DEFAULT_MAX_FAILED_ATTEMPTS_PER_HOUR,
    );
    expect(SIGN_IN_MAX_FAILED_ATTEMPTS_PER_HOUR).toBe(5);
  });

  it("is wired into convexAuth({ signIn }) using the library option name", () => {
    const source = readFileSync(
      path.join(process.cwd(), "convex/auth.ts"),
      "utf8",
    );
    expect(source).toMatch(/SIGN_IN_MAX_FAILED_ATTEMPTS_PER_HOUR/);
    expect(source).toMatch(/maxFailedAttempsPerHour/);
  });
});
