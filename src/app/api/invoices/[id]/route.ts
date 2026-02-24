/**
 * Individual Invoice API
 * GET /api/invoices/[id] - Get a specific invoice
 * DELETE /api/invoices/[id] - Delete a draft invoice
 * Protected: Requires authentication + ownership (via RLS)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handleGET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await getSupabaseForRequest(request);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: invoice, error: queryError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (queryError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("[Get Invoice Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleDELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await getSupabaseForRequest(request);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check invoice exists and is draft (only draft invoices can be deleted)
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status !== "draft") {
      return NextResponse.json(
        {
          error: `Cannot delete ${invoice.status} invoices. Only draft invoices can be deleted.`,
        },
        { status: 403 },
      );
    }

    // Delete the invoice (RLS ensures user_id match)
    const { error: deleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Delete Invoice Error]", deleteError);
      return NextResponse.json(
        { error: "Failed to delete invoice" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("[Delete Invoice Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
export const DELETE = withRateLimit(
  withAudit(handleDELETE, { action: "delete", resourceType: "invoices" }),
);
