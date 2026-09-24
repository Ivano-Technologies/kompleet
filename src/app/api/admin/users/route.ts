import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@/lib/auth/rbac";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

const VALID_ROLES: Role[] = [
  "owner",
  "admin",
  "tax_consultant",
  "user",
  "viewer",
];

/**
 * GET /api/admin/users — List Convex app users.
 * Roles are not stored on the Convex users table; listed role is "user".
 */
export async function GET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const users = await convex.query(api.users.listAll, {});
    const mapped = users.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name || u.email,
      role: "user",
      email_confirmed: true,
      created_at: u.created_at,
      last_sign_in_at: u.last_login_at,
    }));
    return NextResponse.json({ users: mapped });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/users — role writes are OUT of Phase 3.
 * Convex users schema has no role field; do not invent one.
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAuthedConvex(request);
    const body = await request.json();
    const { userId, role } = body as { userId?: string; role?: string };
    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 },
      );
    }
    if (!VALID_ROLES.includes(role as Role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error:
          "Role updates are not available: Convex users have no role field (Phase 3 OUT).",
      },
      { status: 501 },
    );
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
