/** @vitest-environment node */

import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  isPlatformAdmin,
  isPlatformAdminRole,
  platformRoleOf,
  type PlatformRole,
} from "./auth";
import { FORBIDDEN, throwForbidden } from "./errors";

describe("platformRoleOf", () => {
  it("defaults missing or undefined to user", () => {
    expect(platformRoleOf(undefined)).toBe("user");
    expect(platformRoleOf(null)).toBe("user");
    expect(platformRoleOf({ platformRole: undefined })).toBe("user");
  });

  it("returns stored RBAC roles", () => {
    const roles: PlatformRole[] = [
      "owner",
      "admin",
      "tax_consultant",
      "user",
      "viewer",
    ];
    for (const role of roles) {
      expect(platformRoleOf({ platformRole: role })).toBe(role);
    }
  });
});

describe("isPlatformAdminRole", () => {
  it("is true only for owner and admin", () => {
    expect(isPlatformAdminRole("owner")).toBe(true);
    expect(isPlatformAdminRole("admin")).toBe(true);
    expect(isPlatformAdminRole("tax_consultant")).toBe(false);
    expect(isPlatformAdminRole("user")).toBe(false);
    expect(isPlatformAdminRole("viewer")).toBe(false);
  });
});

describe("isPlatformAdmin", () => {
  it("treats missing role as a non-admin user", () => {
    expect(isPlatformAdmin({ platformRole: undefined })).toBe(false);
    expect(isPlatformAdmin({ platformRole: "user" })).toBe(false);
    expect(isPlatformAdmin({ platformRole: "owner" })).toBe(true);
    expect(isPlatformAdmin({ platformRole: "admin" })).toBe(true);
  });
});

describe("throwForbidden", () => {
  it("throws ConvexError FORBIDDEN", () => {
    expect(() => throwForbidden()).toThrow(ConvexError);
    try {
      throwForbidden();
    } catch (error) {
      expect(error).toMatchObject({ name: "ConvexError", data: FORBIDDEN });
    }
  });
});
