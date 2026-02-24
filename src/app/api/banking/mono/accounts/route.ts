import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { getSupabaseForRequest } from "@/lib/supabase/server";

/**
 * GET /api/banking/mono/accounts
 * List user's linked Mono bank accounts
 */
async function handleGET() {
  try {
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: accounts, error: dbError } = await supabase
      .from("bank_accounts")
      .select(
        "id, provider, account_number, account_name, bank_name, balance, currency, status, last_synced_at, created_at",
      )
      .eq("user_id", user.id)
      .eq("provider", "mono")
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("[Mono Accounts] DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch accounts" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      accounts: accounts || [],
      count: accounts?.length || 0,
    });
  } catch (error) {
    console.error("[Mono Accounts Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET, { limit: 60 });
