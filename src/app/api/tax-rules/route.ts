/**
 * Tax Rules API (Database Version)
 * GET /api/tax-rules - Get tax rules from database
 * Protected: Requires 'calculators:read' permission
 */

import { getSupabaseForRequest } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";

async function handleGET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ruleType = searchParams.get("type");

    if (!ruleType) {
      return NextResponse.json(
        { error: "Rule type is required" },
        { status: 400 },
      );
    }

    const supabase = await getSupabaseForRequest(request);

    // Get active rule version (optional: allow no active version and return empty rules)
    const { data: activeVersion, error: versionError } = await supabase
      .from("rule_versions")
      .select("id")
      .eq("is_active", true)
      .single();

    if (versionError || !activeVersion) {
      return NextResponse.json({
        success: true,
        ruleType,
        versionId: null,
        rules: {},
        count: 0,
      });
    }

    // Fetch tax rules for the specified type
    const { data: rules, error: rulesError } = await supabase
      .from("tax_rules")
      .select("*")
      .eq("rule_version_id", activeVersion.id)
      .eq("rule_type", ruleType)
      .order("rule_key");

    if (rulesError) {
      console.error("Error fetching tax rules:", rulesError);
      return NextResponse.json({
        success: true,
        ruleType,
        versionId: activeVersion.id,
        rules: {},
        count: 0,
      });
    }

    // Transform rules into a more usable format
    const rulesMap = (rules ?? []).reduce(
      (acc, rule) => {
        acc[rule.rule_key] = {
          value: rule.rule_value,
          confidence: rule.confidence_level,
          notes: rule.notes,
          lastReviewed: rule.last_reviewed_at,
        };
        return acc;
      },
      {} as Record<string, any>,
    );

    return NextResponse.json({
      success: true,
      ruleType,
      versionId: activeVersion.id,
      rules: rulesMap,
      count: (rules ?? []).length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Apply authentication and authorization (requires calculators:read permission)
export const GET = withAuth(handleGET, {
  requiredPermission: "calculators:read",
});
