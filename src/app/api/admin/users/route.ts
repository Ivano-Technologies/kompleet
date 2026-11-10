import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@/lib/auth/rbac";
import { api } from "@/lib/convex/http";
import {
  isForbidden,
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { friendlyErrorBody, apiErrorBody } from "@/lib/friendly-error";
import { withRateLimit } from "@/lib/with-rate-limit";

const VALID_ROLES: Role[] = [
  "owner",
  "admin",
  "tax_consultant",
  "user",
  "viewer",
];

function forbiddenResponse() {
  return NextResponse.json({ ...apiErrorBody("Forbidden") }, { status: 403 });
}

/**
 * GET /api/admin/users — List Convex app users.
 * Server-side admin check lives in `users:listAll` (owner/admin).
 */
async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const users = await convex.query(api.users.listAll, {});
    const mapped = users.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name || u.email,
      role: u.platform_role,
      email_confirmed: true,
      created_at: u.created_at,
      last_sign_in_at: u.last_login_at,
    }));
    return NextResponse.json({ users: mapped });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    if (isForbidden(error)) {
      return forbiddenResponse();
    }
    return NextResponse.json(
      { ...friendlyErrorBody(error) },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/users — role writes stay 501 for clients.
 * Grant roles with Convex internal `users:setPlatformRole` after deploy.
 */
async function handlePATCH(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    await convex.query(api.users.listAll, {});
    const body = await request.json();
    const { userId, role } = body as { userId?: string; role?: string };
    if (!userId || !role) {
      return NextResponse.json({ ...apiErrorBody("userId and role are required") },
        { status: 400 },
      );
    }
    if (!VALID_ROLES.includes(role as Role)) {
      return NextResponse.json({ ...apiErrorBody(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`) },
        { status: 400 },
      );
    }
    return NextResponse.json({ ...apiErrorBody("Role updates from this API are not available. Use Convex internal users:setPlatformRole.") },
      { status: 501 },
    );
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    if (isForbidden(error)) {
      return forbiddenResponse();
    }
    return NextResponse.json(
      { ...friendlyErrorBody(error) },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET, { limit: 60 });
export const PATCH = withRateLimit(handlePATCH, { limit: 20 });
