import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import type { Id } from "../../../../../convex/_generated/dataModel";

async function handleDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Calculation ID is required" },
        { status: 400 },
      );
    }

    try {
      await convex.mutation(api.audit.removeMine, {
        id: id as Id<"auditLogs">,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("not found")) {
        return NextResponse.json(
          { error: "Calculation not found" },
          { status: 404 },
        );
      }
      if (message.includes("Unauthorized")) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You do not have permission to delete this calculation",
          },
          { status: 403 },
        );
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      message: "Calculation deleted successfully",
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 },
      );
    }
    console.error("[history/[id]] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to delete calculation",
      },
      { status: 500 },
    );
  }
}

export const DELETE = withRateLimit(handleDELETE);
