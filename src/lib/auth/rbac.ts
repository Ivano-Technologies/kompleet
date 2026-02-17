/**
 * Role-Based Access Control (RBAC) System
 *
 * Defines roles, permissions, and access control logic for the KOMPLEET platform.
 */

// Define available roles
export type Role = 'owner' | 'admin' | 'tax_consultant' | 'user' | 'viewer';

// Human-readable role labels
export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  tax_consultant: 'Tax Consultant',
  user: 'User',
  viewer: 'Viewer',
};

// Define granular permissions
export type Permission =
  | 'calculators:read'
  | 'calculators:write'
  | 'transactions:read'
  | 'transactions:write'
  | 'transactions:delete'
  | 'transactions:import'
  | 'reports:read'
  | 'reports:generate'
  | 'export:data'
  | 'export:bulk'
  | 'admin:access'
  | 'admin:manage_users'
  | 'admin:manage_rules'
  | 'admin:view_audit_logs'
  | 'settings:read'
  | 'settings:write';

/**
 * Role-Permission Matrix
 * Defines which permissions each role has
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Owner: Full access to everything
  owner: [
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
  ],

  // Admin: Almost full access, except user management
  admin: [
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
    'admin:manage_rules',
    'admin:view_audit_logs',
    'settings:read',
    'settings:write',
  ],

  // Tax Consultant: Read access + reports/calculations, no data modification
  tax_consultant: [
    'calculators:read',
    'calculators:write',
    'transactions:read',
    'reports:read',
    'reports:generate',
    'export:data',
    'settings:read',
  ],

  // User: Standard user with full data access, no admin
  user: [
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
  ],

  // Viewer: Read-only access
  viewer: [
    'calculators:read',
    'transactions:read',
    'reports:read',
    'settings:read',
  ],
};

/**
 * Check if a role has a specific permission
 *
 * @param userRole - The user's role
 * @param permission - The permission to check
 * @returns True if the role has the permission
 */
export function hasPermission(userRole: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 *
 * @param userRole - The user's role
 * @param permissions - Array of permissions to check
 * @returns True if the role has at least one permission
 */
export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a role has ALL of the specified permissions
 *
 * @param userRole - The user's role
 * @param permissions - Array of permissions to check
 * @returns True if the role has all permissions
 */
export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 *
 * @param userRole - The user's role
 * @returns Array of permissions
 */
export function getPermissions(userRole: Role): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}
