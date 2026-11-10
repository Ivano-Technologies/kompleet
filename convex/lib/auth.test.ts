/** @vitest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import { ConvexError } from "convex/values";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthUserId } = vi.hoisted(() => ({
  getAuthUserId: vi.fn(),
}));

vi.mock("@convex-dev/auth/server", () => ({
  getAuthUserId: (...args: unknown[]) => getAuthUserId(...args),
}));

import {
  getCurrentUser,
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

describe("Supabase JWT trust removed", () => {
  it("does not register a customJwt / Supabase JWKS provider", () => {
    const source = readFileSync(
      path.join(process.cwd(), "convex/auth.config.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/customJwt/);
    expect(source).not.toMatch(/supabase\.co/);
    expect(source).not.toMatch(/frlcvkmjuhnjcicwywrh/);
    expect(source).toMatch(/CONVEX_SITE_URL/);
  });

  it("does not look up users by unverified identity.email", () => {
    const source = readFileSync(
      path.join(process.cwd(), "convex/lib/auth.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/identityEmail/);
    expect(source).not.toMatch(/withIndex\("email"/);
  });
});

describe("getCurrentUser", () => {
  beforeEach(() => {
    getAuthUserId.mockReset();
  });

  it("does not become another user from identity.email alone", async () => {
    const victim = {
      _id: "users:1",
      email: "victim@example.com",
      deletedAt: undefined,
    };
    getAuthUserId.mockResolvedValue(null);
    const ctx = {
      auth: {
        getUserIdentity: async () => ({
          email: "victim@example.com",
          emailVerified: false,
          subject: "attacker-subject",
          tokenIdentifier: "attacker-token",
        }),
      },
      db: {
        get: async () => null,
        query: () => ({
          withIndex: (
            name: string,
            fn: (q: { eq: (field: string, value: string) => unknown }) => unknown,
          ) => {
            let value = "";
            fn({
              eq(_field: string, v: string) {
                value = v;
                return this;
              },
            });
            return {
              unique: async () => {
                if (name === "email" && value === victim.email) {
                  return victim;
                }
                return null;
              },
            };
          },
        }),
      },
    };
    await expect(getCurrentUser(ctx as never)).rejects.toThrow("User not found");
  });
});
