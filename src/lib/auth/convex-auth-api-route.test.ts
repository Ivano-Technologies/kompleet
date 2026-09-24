import { describe, expect, it } from "vitest";
import {
  CONVEX_AUTH_API_ROUTE,
  isExactConvexAuthProxyPath,
} from "./convex-auth-api-route";

describe("isExactConvexAuthProxyPath", () => {
  it("matches exact /api/auth with or without a trailing slash", () => {
    expect(CONVEX_AUTH_API_ROUTE).toBe("/api/auth");
    expect(isExactConvexAuthProxyPath("/api/auth")).toBe(true);
    expect(isExactConvexAuthProxyPath("/api/auth/")).toBe(true);
  });

  it("does not match Convex Auth subroutes used by the app", () => {
    expect(isExactConvexAuthProxyPath("/api/auth/ensure-profile")).toBe(false);
    expect(isExactConvexAuthProxyPath("/api/auth/login")).toBe(false);
    expect(isExactConvexAuthProxyPath("/api/auth/profile")).toBe(false);
    expect(isExactConvexAuthProxyPath("/api/auth/change-password")).toBe(false);
    expect(isExactConvexAuthProxyPath("/api/auth/delete-account")).toBe(false);
  });

  it("does not match pages or other API paths", () => {
    expect(isExactConvexAuthProxyPath("/signup")).toBe(false);
    expect(isExactConvexAuthProxyPath("/login")).toBe(false);
    expect(isExactConvexAuthProxyPath("/api/health")).toBe(false);
    expect(isExactConvexAuthProxyPath("/api")).toBe(false);
    expect(isExactConvexAuthProxyPath("/api/authx")).toBe(false);
  });
});
