import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { exchangeToken, getAccountInfo } from "@/lib/services/mono-service";

/**
 * POST /api/banking/mono/exchange
 * Exchange Mono Connect widget auth code for account ID, save bank account
 */
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

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Missing auth code from Mono Connect" },
        { status: 400 },
      );
    }

    // Exchange code for permanent account ID (code expires in 10 mins)
    const monoAccountId = await exchangeToken(code);

    // Fetch account details from Mono
    const accountInfo = await getAccountInfo(monoAccountId);

    // Store in bank_accounts table
    const { data: bankAccount, error: dbError } = await supabase
      .from("bank_accounts")
      .upsert(
        {
          user_id: user.id,
          provider: "mono",
          account_number: accountInfo.accountNumber,
          account_name: accountInfo.name,
          bank_name: accountInfo.institution.name,
          balance: (accountInfo.balance / 100).toFixed(2), // kobo to Naira
          currency: accountInfo.currency || "NGN",
          status: "active",
          last_synced_at: new Date().toISOString(),
          metadata: {
            mono_account_id: monoAccountId,
            account_type: accountInfo.type,
            bank_code: accountInfo.institution.bankCode,
            auth_method: accountInfo.authMethod,
          },
        },
        { onConflict: "user_id,provider,account_number" },
      )
      .select()
      .single();

    if (dbError) {
      console.error("[Mono Exchange] DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to save bank account" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      account: {
        id: bankAccount.id,
        bankName: accountInfo.institution.name,
        accountNumber: accountInfo.accountNumber,
        accountName: accountInfo.name,
        balance: accountInfo.balance / 100,
      },
    });
  } catch (error) {
    console.error("[Mono Exchange Error]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to link bank account",
      },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 10 });
