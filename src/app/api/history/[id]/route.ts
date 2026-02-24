import { getSupabaseForRequest } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handleDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await getSupabaseForRequest(request);

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Calculation ID is required" },
        { status: 400 },
      );
    }

    // Verify ownership before deleting
    const { data: auditLog, error: fetchError } = await supabase
      .from("audit_logs")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !auditLog) {
      return NextResponse.json(
        { error: "Calculation not found" },
        { status: 404 },
      );
    }

    if (auditLog.user_id !== user.id) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You do not have permission to delete this calculation",
        },
        { status: 403 },
      );
    }

    const { error } = await supabase
      .from("audit_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[history/[id]] Error deleting calculation:", error);
      return NextResponse.json(
        { error: "Failed to delete calculation", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Calculation deleted successfully",
    });
  } catch (error) {
    console.error("[history/[id]] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to delete calculation",
      },
      { status: 500 },
    );
  }
}

export const DELETE = withRateLimit(handleDELETE);
