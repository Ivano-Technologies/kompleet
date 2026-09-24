import { describe, expect, it } from "vitest";
import { ConvexUnauthorizedError, isUnauthorized } from "./server";

describe("isUnauthorized", () => {
  it("matches ConvexUnauthorizedError", () => {
    expect(isUnauthorized(new ConvexUnauthorizedError())).toBe(true);
  });

  it("matches common auth-miss messages so they never become HTTP 500", () => {
    expect(isUnauthorized(new Error("Unauthorized"))).toBe(true);
    expect(isUnauthorized(new Error("Not authenticated"))).toBe(true);
    expect(isUnauthorized(new Error("Authentication required"))).toBe(true);
  });

  it("does not treat queue misconfig as unauthorized", () => {
    expect(
      isUnauthorized(new Error("REDIS_URL is required for document queueing.")),
    ).toBe(false);
  });
});
