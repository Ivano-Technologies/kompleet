import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { hasPermission, type Permission, type Role } from "./rbac";

interface AuthOptions {
  requiredPermission?: Permission;
  requiredPermissions?: Permission[]; // User must have ALL
  anyPermissions?: Permission[]; // User must have ANY
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

type AuthHandler<T extends Request | NextRequest = Request> = (
  request: T,
  user: AuthenticatedUser,
  context?: any,
) => Promise<Response> | Response;

/**
 * Higher-order function that adds authentication and authorization to API route handlers
 *
 * Usage:
 * ```typescript
 * export const POST = withAuth(async (request, user) => {
 *   // user.id, user.email, user.role are available
 *   // Your handler code
 * }, { requiredPermission: 'admin:access' });
 * ```
 *
 * @param handler - The API route handler function
 * @param options - Authentication and authorization options
 * @returns Wrapped handler with auth checks
 */
export function withAuth<T extends Request | NextRequest = Request>(
  handler: AuthHandler<T>,
  options: AuthOptions = {},
): (request: T, context?: any) => Promise<Response> {
  return async (request: T, context?: any) => {
    try {
      const supabase = await getSupabaseForRequest(request);

      // Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 },
        );
      }

      // Read role from app_metadata (set by admin only, not user-writable)
      const userRole = (user.app_metadata?.role || "user") as Role;

      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        email: user.email || "",
        role: userRole,
      };

      // Check required permission (single)
      if (options.requiredPermission) {
        if (!hasPermission(userRole, options.requiredPermission)) {
          return NextResponse.json(
            {
              error: "Forbidden",
              message: `Permission '${options.requiredPermission}' required`,
              userRole,
            },
            { status: 403 },
          );
        }
      }

      // Check required permissions (ALL)
      if (
        options.requiredPermissions &&
        options.requiredPermissions.length > 0
      ) {
        const missingPermissions = options.requiredPermissions.filter(
          (permission) => !hasPermission(userRole, permission),
        );

        if (missingPermissions.length > 0) {
          return NextResponse.json(
            {
              error: "Forbidden",
              message: `Missing permissions: ${missingPermissions.join(", ")}`,
              userRole,
            },
            { status: 403 },
          );
        }
      }

      // Check any permissions (ANY)
      if (options.anyPermissions && options.anyPermissions.length > 0) {
        const hasAny = options.anyPermissions.some((permission) =>
          hasPermission(userRole, permission),
        );

        if (!hasAny) {
          return NextResponse.json(
            {
              error: "Forbidden",
              message: `At least one of these permissions required: ${options.anyPermissions.join(", ")}`,
              userRole,
            },
            { status: 403 },
          );
        }
      }

      // All checks passed - execute handler with authenticated user
      return await handler(request, authenticatedUser, context);
    } catch (error) {
      console.error("[withAuth Error]", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
