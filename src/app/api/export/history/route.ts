import { NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handleGET() {
  try {
    const supabase = await getSupabaseForRequest(request);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch export history
    const { data: history, error } = await supabase
      .from("export_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching export history:", error);
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: 500 },
      );
    }

    return NextResponse.json({ history: history || [] });
  } catch (error) {
    console.error("Error in /api/export/history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
