/**
 * Tax Rules API
 * GET /api/tax/rules - Get tax rules (optionally filtered)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { api } from "@/lib/convex/http";
import { requireAuthedConvex } from "@/lib/convex/server";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const searchParams = request.nextUrl.searchParams;
    const versionId = searchParams.get("version_id");
    const ruleType = searchParams.get("rule_type");
    const ruleKeys = searchParams.get("rule_keys")?.split(",") || undefined;

    const versions = await convex.query(api.tax.listRuleVersions, {});
    const version =
      versions.find((row) => row.id === versionId) ??
      versions.find((row) => row.is_active) ??
      null;

    const rules = version
      ? await convex.query(api.tax.listRulesForVersion, {
          versionExternalId: version.id,
          ruleTypes: ruleType ? [ruleType] : undefined,
        })
      : [];

    const filtered = ruleKeys
      ? rules.filter((rule) =>
          ruleKeys.includes((rule as { rule_key?: string }).rule_key ?? ""),
        )
      : rules;

    return NextResponse.json({
      rules: filtered,
      version,
      source: "Nigeria Tax Act 2025",
    });
  } catch (error) {
    console.error("Error in GET /api/tax/rules:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(handleGET, {
  requiredPermission: "admin:manage_rules",
});
