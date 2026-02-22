/**
 * Delete Account API
 * POST /api/auth/delete-account
 * Protected: Requires authentication + confirmation
 * Soft-deletes user data, then removes auth account
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
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
    const supabase = await createServerClient();

    // Check authentication
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

    // Log deletion to audit trail BEFORE deleting
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "account_deletion",
      resource_type: "user",
      resource_id: user.id,
      metadata: { email: user.email },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    // Soft-delete: mark user as deactivated in users table
    await supabase
      .from("users")
      .update({ status: "deactivated" })
      .eq("id", user.id);

    // Delete auth user using admin client (service role)
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

    // Sign out
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
