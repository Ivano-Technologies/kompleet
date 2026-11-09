import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { apiErrorBody } from "@/lib/friendly-error";

/**
 * Year to year data copy is not built. This route stays unpublished so the
 * tax year selector can still switch the working year without a migrate tool.
 */
export const POST = withAuth(async () => {
  return NextResponse.json({ ...apiErrorBody("Not found.") }, { status: 404 });
}, { requiredPermission: "admin:access" });
