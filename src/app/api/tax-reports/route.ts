import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/with-rate-limit";

export const runtime = "nodejs";

async function handleGET(request: NextRequest) {
  try {
    const supabase = await createClient();

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
    const taxYear = searchParams.get("taxYear");
    const status = searchParams.get("status");
    const reportType = searchParams.get("reportType");

    // Build query
    let query = supabase
      .from("tax_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (taxYear) {
      query = query.eq("tax_year", parseInt(taxYear));
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (reportType) {
      query = query.eq("report_type", reportType);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error("Error fetching tax reports:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("Error in GET /api/tax-reports:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
