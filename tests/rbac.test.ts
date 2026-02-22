import { describe, it, expect } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissions,
  ROLE_PERMISSIONS,
} from "../src/lib/auth/rbac";

describe("Role-Based Access Control (RBAC)", () => {
  describe("hasPermission", () => {
    it("owner should have all permissions", () => {
      expect(hasPermission("owner", "admin:access")).toBe(true);
      expect(hasPermission("owner", "admin:manage_users")).toBe(true);
      expect(hasPermission("owner", "transactions:delete")).toBe(true);
      expect(hasPermission("owner", "export:bulk")).toBe(true);
    });

    it("admin should have admin access but not manage users", () => {
      expect(hasPermission("admin", "admin:access")).toBe(true);
      expect(hasPermission("admin", "admin:manage_users")).toBe(false);
      expect(hasPermission("admin", "transactions:write")).toBe(true);
    });

    it("user should have standard permissions but not admin", () => {
      expect(hasPermission("user", "calculators:read")).toBe(true);
      expect(hasPermission("user", "calculators:write")).toBe(true);
      expect(hasPermission("user", "transactions:write")).toBe(true);
      expect(hasPermission("user", "admin:access")).toBe(false);
      expect(hasPermission("user", "export:bulk")).toBe(false);
    });

    it("viewer should only have read permissions", () => {
      expect(hasPermission("viewer", "calculators:read")).toBe(true);
      expect(hasPermission("viewer", "transactions:read")).toBe(true);
      expect(hasPermission("viewer", "calculators:write")).toBe(false);
      expect(hasPermission("viewer", "transactions:write")).toBe(false);
      expect(hasPermission("viewer", "admin:access")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true if user has at least one permission", () => {
      expect(
        hasAnyPermission("user", ["admin:access", "calculators:read"]),
      ).toBe(true); // has calculators:read
      expect(
        hasAnyPermission("admin", ["admin:manage_users", "admin:access"]),
      ).toBe(true); // has admin:access
    });

    it("should return false if user has none of the permissions", () => {
      expect(
        hasAnyPermission("viewer", ["transactions:write", "admin:access"]),
      ).toBe(false);
      expect(
        hasAnyPermission("user", ["admin:access", "admin:manage_users"]),
      ).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("should return true if user has all permissions", () => {
      expect(
        hasAllPermissions("owner", [
          "admin:access",
          "admin:manage_users",
          "export:bulk",
        ]),
      ).toBe(true);
      expect(
        hasAllPermissions("user", ["calculators:read", "transactions:read"]),
      ).toBe(true);
    });

    it("should return false if user is missing any permission", () => {
      expect(
        hasAllPermissions("admin", ["admin:access", "admin:manage_users"]),
      ).toBe(false); // missing manage_users
      expect(
        hasAllPermissions("viewer", ["calculators:read", "calculators:write"]),
      ).toBe(false); // missing write
    });
  });

  describe("getPermissions", () => {
    it("should return all permissions for a role", () => {
      const ownerPermissions = getPermissions("owner");
      expect(ownerPermissions).toContain("admin:access");
      expect(ownerPermissions).toContain("admin:manage_users");
      expect(ownerPermissions.length).toBeGreaterThan(10);

      const viewerPermissions = getPermissions("viewer");
      expect(viewerPermissions.length).toBe(4); // Only 4 read permissions
      expect(viewerPermissions.every((p) => p.endsWith(":read"))).toBe(true);
    });
  });

  describe("Role hierarchy", () => {
    it("owner should have more permissions than admin", () => {
      const ownerPerms = getPermissions("owner");
      const adminPerms = getPermissions("admin");
      expect(ownerPerms.length).toBeGreaterThan(adminPerms.length);
    });

    it("admin should have more permissions than user", () => {
      const adminPerms = getPermissions("admin");
      const userPerms = getPermissions("user");
      expect(adminPerms.length).toBeGreaterThan(userPerms.length);
    });

    it("user should have more permissions than viewer", () => {
      const userPerms = getPermissions("user");
      const viewerPerms = getPermissions("viewer");
      expect(userPerms.length).toBeGreaterThan(viewerPerms.length);
    });
  });
});
