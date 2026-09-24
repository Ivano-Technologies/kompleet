import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const { action, resource_type, resource_id, tax_year, metadata } = body as {
      action?: string;
      resource_type?: string;
      resource_id?: string;
      tax_year?: number;
      metadata?: unknown;
    };

    if (!action || !resource_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await convex.mutation(api.audit.append, {
      action,
      resourceType: resource_type,
      entityId: resource_id,
      ipAddress:
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      metadata: {
        ...(metadata && typeof metadata === "object" ? metadata : {}),
        tax_year: tax_year ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/audit/log:", error);
    return NextResponse.json({
      success: true,
      warning: "Audit log failed but action completed",
    });
  }
}

export const POST = withRateLimit(handlePOST);
