import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getPermissions,
  ROLE_PERMISSIONS,
  type Role,
  type Permission,
} from './rbac';

/**
 * All 16 permissions defined in the RBAC system.
 */
const ALL_PERMISSIONS: Permission[] = [
  'calculators:read',
  'calculators:write',
  'transactions:read',
  'transactions:write',
  'transactions:delete',
  'transactions:import',
  'reports:read',
  'reports:generate',
  'export:data',
  'export:bulk',
  'admin:access',
  'admin:manage_users',
  'admin:manage_rules',
  'admin:view_audit_logs',
  'settings:read',
  'settings:write',
];

describe('RBAC System', () => {
  // ─── ROLE_PERMISSIONS constant ────────────────────────────────────────────

  describe('ROLE_PERMISSIONS', () => {
    it('should define permissions for all five roles', () => {
      const roles: Role[] = ['owner', 'admin', 'tax_consultant', 'user', 'viewer'];
      for (const role of roles) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      }
    });

    it('should contain exactly 16 unique permissions across the system', () => {
      const allUnique = new Set(ROLE_PERMISSIONS.owner);
      expect(allUnique.size).toBe(16);
    });
  });

  // ─── Owner role ───────────────────────────────────────────────────────────

  describe('Owner role', () => {
    it('should have ALL 16 permissions', () => {
      expect(ROLE_PERMISSIONS.owner).toHaveLength(16);
      for (const perm of ALL_PERMISSIONS) {
        expect(hasPermission('owner', perm)).toBe(true);
      }
    });

    it('should include admin:manage_users (unique to owner)', () => {
      expect(hasPermission('owner', 'admin:manage_users')).toBe(true);
    });
  });

  // ─── Admin role ───────────────────────────────────────────────────────────

  describe('Admin role', () => {
    it('should have 15 permissions (all except admin:manage_users)', () => {
      expect(ROLE_PERMISSIONS.admin).toHaveLength(15);
    });

    it('should NOT have admin:manage_users', () => {
      expect(hasPermission('admin', 'admin:manage_users')).toBe(false);
    });

    it('should have every other permission that the owner has', () => {
      const ownerPermsExceptManageUsers = ALL_PERMISSIONS.filter(
        (p) => p !== 'admin:manage_users'
      );
      for (const perm of ownerPermsExceptManageUsers) {
        expect(hasPermission('admin', perm)).toBe(true);
      }
    });

    it('should have admin:access, admin:manage_rules, and admin:view_audit_logs', () => {
      expect(hasPermission('admin', 'admin:access')).toBe(true);
      expect(hasPermission('admin', 'admin:manage_rules')).toBe(true);
      expect(hasPermission('admin', 'admin:view_audit_logs')).toBe(true);
    });

    it('should have export:bulk', () => {
      expect(hasPermission('admin', 'export:bulk')).toBe(true);
    });
  });

  // ─── Tax Consultant role ──────────────────────────────────────────────────

  describe('Tax Consultant role', () => {
    it('should have 7 permissions', () => {
      expect(ROLE_PERMISSIONS.tax_consultant).toHaveLength(7);
    });

    it('should have read + reports/calculations permissions', () => {
      const expectedPermissions: Permission[] = [
        'calculators:read',
        'calculators:write',
        'transactions:read',
        'reports:read',
        'reports:generate',
        'export:data',
        'settings:read',
      ];
      for (const perm of expectedPermissions) {
        expect(hasPermission('tax_consultant', perm)).toBe(true);
      }
    });

    it('should NOT have write/delete/import transaction permissions', () => {
      expect(hasPermission('tax_consultant', 'transactions:write')).toBe(false);
      expect(hasPermission('tax_consultant', 'transactions:delete')).toBe(false);
      expect(hasPermission('tax_consultant', 'transactions:import')).toBe(false);
    });

    it('should NOT have any admin:* permissions', () => {
      expect(hasPermission('tax_consultant', 'admin:access')).toBe(false);
      expect(hasPermission('tax_consultant', 'admin:manage_users')).toBe(false);
    });

    it('should NOT have settings:write', () => {
      expect(hasPermission('tax_consultant', 'settings:write')).toBe(false);
    });
  });

  // ─── User role ────────────────────────────────────────────────────────────

  describe('User role', () => {
    it('should have 11 permissions', () => {
      expect(ROLE_PERMISSIONS.user).toHaveLength(11);
    });

    it('should have standard data access permissions', () => {
      const expectedPermissions: Permission[] = [
        'calculators:read',
        'calculators:write',
        'transactions:read',
        'transactions:write',
        'transactions:delete',
        'transactions:import',
        'reports:read',
        'reports:generate',
        'export:data',
        'settings:read',
        'settings:write',
      ];
      for (const perm of expectedPermissions) {
        expect(hasPermission('user', perm)).toBe(true);
      }
    });

    it('should NOT have any admin:* permissions', () => {
      expect(hasPermission('user', 'admin:access')).toBe(false);
      expect(hasPermission('user', 'admin:manage_users')).toBe(false);
      expect(hasPermission('user', 'admin:manage_rules')).toBe(false);
      expect(hasPermission('user', 'admin:view_audit_logs')).toBe(false);
    });

    it('should NOT have export:bulk', () => {
      expect(hasPermission('user', 'export:bulk')).toBe(false);
    });
  });

  // ─── Viewer role ──────────────────────────────────────────────────────────

  describe('Viewer role', () => {
    it('should have exactly 4 read-only permissions', () => {
      expect(ROLE_PERMISSIONS.viewer).toHaveLength(4);
    });

    it('should only have *:read permissions', () => {
      const viewerPermissions = getPermissions('viewer');
      for (const perm of viewerPermissions) {
        expect(perm).toMatch(/:read$/);
      }
    });

    it('should have calculators:read, transactions:read, reports:read, and settings:read', () => {
      expect(hasPermission('viewer', 'calculators:read')).toBe(true);
      expect(hasPermission('viewer', 'transactions:read')).toBe(true);
      expect(hasPermission('viewer', 'reports:read')).toBe(true);
      expect(hasPermission('viewer', 'settings:read')).toBe(true);
    });

    it('should NOT have any write, delete, import, or admin permissions', () => {
      const nonReadPermissions = ALL_PERMISSIONS.filter(
        (p) => !p.endsWith(':read')
      );
      for (const perm of nonReadPermissions) {
        expect(hasPermission('viewer', perm)).toBe(false);
      }
    });
  });

  // ─── hasPermission ────────────────────────────────────────────────────────

  describe('hasPermission', () => {
    it('should return true when role has the permission', () => {
      expect(hasPermission('owner', 'calculators:read')).toBe(true);
      expect(hasPermission('admin', 'reports:generate')).toBe(true);
      expect(hasPermission('user', 'transactions:write')).toBe(true);
      expect(hasPermission('viewer', 'reports:read')).toBe(true);
    });

    it('should return false when role does not have the permission', () => {
      expect(hasPermission('viewer', 'calculators:write')).toBe(false);
      expect(hasPermission('user', 'admin:access')).toBe(false);
      expect(hasPermission('admin', 'admin:manage_users')).toBe(false);
    });
  });

  // ─── hasAnyPermission ─────────────────────────────────────────────────────

  describe('hasAnyPermission', () => {
    it('should return true if the role has at least one of the requested permissions', () => {
      expect(
        hasAnyPermission('viewer', ['calculators:write', 'calculators:read'])
      ).toBe(true);
    });

    it('should return false if the role has none of the requested permissions', () => {
      expect(
        hasAnyPermission('viewer', [
          'calculators:write',
          'transactions:write',
          'admin:access',
        ])
      ).toBe(false);
    });

    it('should return true when all requested permissions are present', () => {
      expect(
        hasAnyPermission('owner', ['admin:manage_users', 'admin:access'])
      ).toBe(true);
    });

    it('should handle a single-element array', () => {
      expect(hasAnyPermission('user', ['export:data'])).toBe(true);
      expect(hasAnyPermission('user', ['export:bulk'])).toBe(false);
    });

    it('should return false for an empty permissions array', () => {
      // Array.some on empty array returns false
      expect(hasAnyPermission('owner', [])).toBe(false);
    });
  });

  // ─── hasAllPermissions ────────────────────────────────────────────────────

  describe('hasAllPermissions', () => {
    it('should return true only when the role has ALL requested permissions', () => {
      expect(
        hasAllPermissions('owner', [
          'admin:manage_users',
          'admin:access',
          'calculators:read',
        ])
      ).toBe(true);
    });

    it('should return false if even one permission is missing', () => {
      expect(
        hasAllPermissions('admin', [
          'admin:access',
          'admin:manage_users', // admin lacks this
        ])
      ).toBe(false);
    });

    it('should return true for an empty permissions array', () => {
      // Array.every on empty array returns true
      expect(hasAllPermissions('viewer', [])).toBe(true);
    });

    it('should return true when viewer has all read permissions', () => {
      expect(
        hasAllPermissions('viewer', [
          'calculators:read',
          'transactions:read',
          'reports:read',
          'settings:read',
        ])
      ).toBe(true);
    });

    it('should return false when user requests admin permissions', () => {
      expect(
        hasAllPermissions('user', [
          'calculators:read',
          'admin:access', // user lacks this
        ])
      ).toBe(false);
    });
  });

  // ─── getPermissions ───────────────────────────────────────────────────────

  describe('getPermissions', () => {
    it('should return all 16 permissions for owner', () => {
      const permissions = getPermissions('owner');
      expect(permissions).toHaveLength(16);
      expect(permissions).toEqual(expect.arrayContaining(ALL_PERMISSIONS));
    });

    it('should return 15 permissions for admin', () => {
      const permissions = getPermissions('admin');
      expect(permissions).toHaveLength(15);
      expect(permissions).not.toContain('admin:manage_users');
    });

    it('should return 11 permissions for user', () => {
      const permissions = getPermissions('user');
      expect(permissions).toHaveLength(11);
    });

    it('should return 4 permissions for viewer', () => {
      const permissions = getPermissions('viewer');
      expect(permissions).toHaveLength(4);
    });

    it('should return the same array reference as ROLE_PERMISSIONS', () => {
      // getPermissions returns the direct reference from the record
      expect(getPermissions('owner')).toBe(ROLE_PERMISSIONS.owner);
      expect(getPermissions('admin')).toBe(ROLE_PERMISSIONS.admin);
      expect(getPermissions('user')).toBe(ROLE_PERMISSIONS.user);
      expect(getPermissions('viewer')).toBe(ROLE_PERMISSIONS.viewer);
    });
  });

  // ─── Role hierarchy validation ────────────────────────────────────────────

  describe('Role hierarchy', () => {
    it('should ensure owner >= admin >= user >= viewer in permissions', () => {
      const ownerPerms = new Set(getPermissions('owner'));
      const adminPerms = new Set(getPermissions('admin'));
      const userPerms = new Set(getPermissions('user'));
      const viewerPerms = new Set(getPermissions('viewer'));

      // Every admin permission should exist in owner
      for (const perm of adminPerms) {
        expect(ownerPerms.has(perm)).toBe(true);
      }

      // Every user permission should exist in admin
      for (const perm of userPerms) {
        expect(adminPerms.has(perm)).toBe(true);
      }

      // Every viewer permission should exist in user
      for (const perm of viewerPerms) {
        expect(userPerms.has(perm)).toBe(true);
      }
    });

    it('should have strictly decreasing permission counts: owner > admin > user > viewer', () => {
      expect(getPermissions('owner').length).toBeGreaterThan(
        getPermissions('admin').length
      );
      expect(getPermissions('admin').length).toBeGreaterThan(
        getPermissions('user').length
      );
      expect(getPermissions('user').length).toBeGreaterThan(
        getPermissions('viewer').length
      );
    });
  });
});
