import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/with-rate-limit";

export const runtime = "nodejs";

async function handleGET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const params = await context.params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: report, error } = await supabase
      .from("tax_reports")
      .select("*")
      .eq("id", (await params).id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching tax report:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("Error in GET /api/tax-reports/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

async function handlePATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const params = await context.params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, filed_at, paid_at, payment_reference } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (filed_at) updateData.filed_at = filed_at;
    if (paid_at) updateData.paid_at = paid_at;
    if (payment_reference) updateData.payment_reference = payment_reference;

    const { data: report, error } = await supabase
      .from("tax_reports")
      .update(updateData)
      .eq("id", (await params).id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating tax report:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("Error in PATCH /api/tax-reports/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleDELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const params = await context.params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("tax_reports")
      .delete()
      .eq("id", (await params).id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting tax report:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /api/tax-reports/[id]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
export const PATCH = withRateLimit(handlePATCH);
export const DELETE = withRateLimit(handleDELETE);
