import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handlePOST(request: NextRequest) {
  try {
    const { convex, user } = await requireAuthedConvex(request);
    const body = await request.json();
    const { calculationType, inputData, outputData, ruleVersionId } = body as {
      calculationType?: string;
      inputData?: unknown;
      outputData?: unknown;
      ruleVersionId?: string;
    };

    if (!calculationType || !inputData || !outputData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let versionId = ruleVersionId;
    if (!versionId) {
      const versions = await convex.query(api.tax.listRuleVersions, {});
      versionId = versions.find((v) => v.is_active)?.id;
    }

    const auditLogId = await convex.mutation(api.audit.append, {
      action: "calculation",
      resourceType: "calculation",
      metadata: {
        calculation_type: calculationType,
        input_data: inputData,
        output_data: outputData,
        rule_version_id: versionId ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      auditLogId,
      message: "Calculation logged successfully",
      userId: user.id,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }
    console.error("[audit-log] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to create audit log" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST);
