/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  CONVEX_AUTH_JWT,
  CONVEX_AUTH_SESSION,
  JWT_DURATION_MS,
  SESSION_INACTIVE_MS,
  SESSION_TOTAL_MS,
} from "./sessionPolicy";

describe("sessionPolicy", () => {
  it("is shorter than Convex Auth library defaults", () => {
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;
    expect(JWT_DURATION_MS).toBe(30 * 60 * 1000);
    expect(JWT_DURATION_MS).toBeLessThan(hour);
    expect(SESSION_INACTIVE_MS).toBe(7 * day);
    expect(SESSION_INACTIVE_MS).toBeLessThan(30 * day);
    expect(SESSION_TOTAL_MS).toBe(14 * day);
    expect(SESSION_TOTAL_MS).toBeLessThan(30 * day);
    expect(SESSION_TOTAL_MS).toBeGreaterThanOrEqual(SESSION_INACTIVE_MS);
  });

  it("exports the objects passed to convexAuth", () => {
    expect(CONVEX_AUTH_JWT).toEqual({ durationMs: JWT_DURATION_MS });
    expect(CONVEX_AUTH_SESSION).toEqual({
      totalDurationMs: SESSION_TOTAL_MS,
      inactiveDurationMs: SESSION_INACTIVE_MS,
    });
  });
});
