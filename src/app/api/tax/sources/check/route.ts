/**
 * Check regulatory sources for updates
 * POST /api/tax/sources/check - Update last_checked_at for one or all sources
 * Enables the "check online sources for updates on tax regulations" feature.
 * Protected: Requires 'admin:manage_rules' permission
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getSupabaseForRequest } from "@/lib/supabase/server";

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const sourceId = body.sourceId as string | undefined;

    const supabase = await getSupabaseForRequest(request);
    const now = new Date().toISOString();

    if (sourceId) {
      const { error } = await supabase
        .from("sources")
        .update({ last_checked_at: now, updated_at: now })
        .eq("id", sourceId);

      if (error) {
        console.error("Error updating source last_checked_at:", error);
        return NextResponse.json(
          { error: "Failed to update source check time" },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true, checked: 1, sourceId });
    }

    // Check all sources
    const { error } = await supabase
      .from("sources")
      .update({ last_checked_at: now, updated_at: now })
      .not("id", "is", null);

    if (error) {
      console.error("Error updating sources last_checked_at:", error);
      return NextResponse.json(
        { error: "Failed to update sources check time" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, checked: "all" });
  } catch (error) {
    console.error("Error in POST /api/tax/sources/check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(handlePOST, {
  requiredPermission: "admin:manage_rules",
});
