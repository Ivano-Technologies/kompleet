/**
 * Delete Account API
 * POST /api/auth/delete-account
 * Protected: Requires authentication + confirmation
 *
 * Soft-deletes the profile (sets deleted_at), then removes the auth account.
 * public.users never existed — a prior update against that name was a silent no-op.
 *
 * Tenancy note (docs/TENANCY_DESIGN.md risk #12): before multi-tenant launch,
 * deleting a practitioner must not cascade clients' statutory records. That
 * policy lands with the firms/clients spine in Phase 3.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { withRateLimit } from "@/lib/with-rate-limit";
import { z } from "zod";

const deleteAccountSchema = z.object({
  confirmText: z.literal("DELETE", {
    error: "You must type DELETE to confirm",
  }),
});

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await getSupabaseForRequest(request);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = deleteAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { error: auditError } = await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "account_deletion",
      resource_type: "user",
      resource_id: user.id,
      metadata: { email: user.email },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    if (auditError) {
      console.error("[Delete Account] audit_logs insert failed", auditError);
      return NextResponse.json(
        { error: "Failed to record deletion audit. Account was not deleted." },
        { status: 500 },
      );
    }

    // Soft-delete against profiles (the real user table). Check the error —
    // a silent failure here previously left no deactivation trail.
    const { error: softDeleteError } = await supabase
      .from("profiles")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (softDeleteError) {
      console.error("[Delete Account] profiles soft-delete failed", softDeleteError);
      return NextResponse.json(
        {
          error:
            "Failed to deactivate profile. Account was not deleted. Please contact support.",
        },
        { status: 500 },
      );
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id,
    );

    if (deleteError) {
      console.error("[Delete Account Error]", deleteError);
      return NextResponse.json(
        { error: "Failed to delete account. Please contact support." },
        { status: 500 },
      );
    }

    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("[Delete Account Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 3, window: 3600000 });
