/**
 * Individual Tax Calculation API
 * GET /api/calculations/[id] - Get a specific calculation
 * PATCH /api/calculations/[id] - Update a calculation (if not finalized)
 * DELETE /api/calculations/[id] - Delete a calculation (if not finalized)
 * Protected: Requires authentication + ownership (via RLS)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { updateCalculationSchema } from "@/lib/schemas/calculations";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

async function handleGET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerClient();

    // Get authenticated user
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

    // Fetch calculation (RLS ensures user can only see their own)
    const { data: calculation, error: queryError } = await supabase
      .from("tax_calculations")
      .select("*")
      .eq("id", id)
      .single();

    if (queryError || !calculation) {
      return NextResponse.json(
        {
          error: "Not found",
          message: "Calculation not found or access denied",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      calculation,
    });
  } catch (error) {
    console.error("[Get Calculation Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handlePATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerClient();

    // Get authenticated user
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

    // Parse and validate request body
    const body = await request.json();
    const parsed = updateCalculationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updates = parsed.data;

    // Update calculation (RLS ensures user_id match AND is_final = false)
    const { data: calculation, error: updateError } = await supabase
      .from("tax_calculations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError || !calculation) {
      // Check if calculation exists but is finalized
      const { data: existing } = await supabase
        .from("tax_calculations")
        .select("is_final")
        .eq("id", id)
        .single();

      if (existing?.is_final) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Cannot update finalized calculations",
          },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          error: "Not found",
          message: "Calculation not found or access denied",
        },
        { status: 404 },
      );
    }

    // Log update
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "update",
      resource_type: "tax_calculation",
      resource_id: id,
      metadata: { updated_fields: Object.keys(updates) },
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      calculation,
      message: "Calculation updated successfully",
    });
  } catch (error) {
    console.error("[Update Calculation Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleDELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createServerClient();

    // Get authenticated user
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

    // Delete calculation (RLS ensures user_id match AND is_final = false)
    const { error: deleteError } = await supabase
      .from("tax_calculations")
      .delete()
      .eq("id", id);

    if (deleteError) {
      // Check if calculation exists but is finalized
      const { data: existing } = await supabase
        .from("tax_calculations")
        .select("is_final")
        .eq("id", id)
        .single();

      if (existing?.is_final) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Cannot delete finalized calculations",
          },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          error: "Not found",
          message: "Calculation not found or access denied",
        },
        { status: 404 },
      );
    }

    // Log deletion
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "delete",
      resource_type: "tax_calculation",
      resource_id: id,
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      message: "Calculation deleted successfully",
    });
  } catch (error) {
    console.error("[Delete Calculation Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
export const PATCH = withRateLimit(handlePATCH);
export const DELETE = withRateLimit(handleDELETE);
