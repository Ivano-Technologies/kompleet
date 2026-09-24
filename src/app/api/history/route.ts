import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const logs = await convex.query(api.audit.listMine, {});
    let filtered = logs.filter((item) => {
      const meta =
        item.metadata && typeof item.metadata === "object"
          ? (item.metadata as Record<string, unknown>)
          : {};
      const calculationType =
        typeof meta.calculation_type === "string"
          ? meta.calculation_type
          : item.action === "calculation"
            ? item.resource_type
            : null;
      if (!calculationType && item.action !== "calculation") return false;
      if (type && calculationType !== type) return false;
      if (from && item.created_at < from) return false;
      if (to && item.created_at > to) return false;
      if (search) {
        const hay = JSON.stringify(meta).toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });

    const total = filtered.length;
    filtered = filtered.slice(offset, offset + limit);

    const transformedData = filtered.map((item) => {
      const meta =
        item.metadata && typeof item.metadata === "object"
          ? (item.metadata as Record<string, unknown>)
          : {};
      return {
        id: item.id,
        calculation_type: meta.calculation_type ?? item.resource_type,
        inputs: meta.input_data ?? {},
        results: meta.output_data ?? meta.result_data ?? {},
        rule_version_id: meta.rule_version_id ?? null,
        created_at: item.created_at,
      };
    });

    return NextResponse.json({
      data: transformedData,
      total,
      limit,
      offset,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }
    console.error("[history] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch history" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
