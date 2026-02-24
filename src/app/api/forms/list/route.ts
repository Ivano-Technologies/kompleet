import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const formType = searchParams.get("formType");
    const taxYear = searchParams.get("taxYear");
    const status = searchParams.get("status");

    // Build query
    let query = supabase
      .from("nrs_forms")
      .select(
        `
        *,
        filing_status (
          status,
          filed_date,
          confirmation_number
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (formType) {
      query = query.eq("form_type", formType);
    }
    if (taxYear) {
      query = query.eq("tax_year", parseInt(taxYear));
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: forms, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch forms" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      forms: forms || [],
      count: forms?.length || 0,
    });
  } catch (error) {
    console.error("List forms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
