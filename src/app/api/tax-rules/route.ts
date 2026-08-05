/**
 * Tax Rules API
 * GET /api/tax-rules?type=vat — active rules with gaps filled from the
 * latest inactive (unverified) rule_version. See loadRuleBundle.
 * Protected: Requires 'calculators:read' permission
 */

import { getSupabaseForRequest } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { loadRuleBundle } from "@/lib/tax/rule-loader";

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
    const bundle = await loadRuleBundle({
      ruleTypes: [ruleType],
      client: supabase,
    });

    const rulesMap: Record<
      string,
      {
        value: unknown;
        confidence: string;
        notes: string | null;
        lastReviewed: string | null;
        ruleVersionId: string;
      }
    > = {};

    for (const rule of bundle.rules.values()) {
      if (rule.ruleType !== ruleType) continue;
      rulesMap[rule.ruleKey] = {
        value: rule.value,
        confidence: rule.confidenceLevel,
        notes: rule.notes,
        lastReviewed: rule.lastReviewedAt,
        ruleVersionId: rule.ruleVersionId,
      };
    }

    return NextResponse.json({
      success: true,
      ruleType,
      versionId: bundle.activeVersionId,
      unverifiedVersionId: bundle.unverifiedVersionId,
      rules: rulesMap,
      count: Object.keys(rulesMap).length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(handleGET, {
  requiredPermission: "calculators:read",
});
