import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { getUpcomingDeadlines } from "@/lib/deadline-service";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handleGET(request: NextRequest) {
  try {
    const supabase = await getSupabaseForRequest(request);

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get upcoming deadlines
    const deadlines = await getUpcomingDeadlines(user.id);

    return NextResponse.json({
      success: true,
      deadlines,
      count: deadlines.length,
    });
  } catch (error) {
    console.error("Get upcoming deadlines error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET, { limit: 120 });
