import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

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

    const body = await request.json();
    const { calculationType, inputData, outputData, ruleVersionId } = body;

    if (!calculationType || !inputData || !outputData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // If no ruleVersionId provided, get the active one
    let versionId = ruleVersionId;
    if (!versionId) {
      const { data: activeVersion } = await supabase
        .from("rule_versions")
        .select("id")
        .eq("is_active", true)
        .single();

      versionId = activeVersion?.id;
    }

    // Insert audit log with authenticated user
    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        calculation_type: calculationType,
        input_data: inputData,
        output_data: outputData,
        rule_version_id: versionId,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating audit log:", error);
      return NextResponse.json(
        { error: "Failed to create audit log" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      auditLogId: data.id,
      message: "Calculation logged successfully",
      userId: user.id,
    });
  } catch (error) {
    console.error("[audit-log] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to create audit log" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST);
