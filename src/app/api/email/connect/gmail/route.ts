import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/email/gmail";
import { randomBytes } from "crypto";
import { withRateLimit } from "@/lib/with-rate-limit";
import { getSupabaseForRequest } from "@/lib/supabase/server";

async function handlePOST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate state token for CSRF protection
    const state = randomBytes(32).toString("hex");

    // Store state in session/cookie (simplified - in production use proper session management)
    const response = NextResponse.json({
      authorization_url: getAuthorizationUrl(state),
      state,
    });

    // Set state cookie
    response.cookies.set("gmail_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error("[Gmail Connect Error]", error);
    return NextResponse.json(
      { error: "Failed to initialize Gmail connection" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 10 });
