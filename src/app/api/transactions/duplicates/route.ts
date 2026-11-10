/**
 * Duplicate Resolution API
 * GET /api/transactions/duplicates - Get pending duplicates
 * POST /api/transactions/duplicates - Resolve duplicate
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";
import { collectPagedItems, EXPORT_BATCH } from "@/lib/convex/collect-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleGET(request: NextRequest): Promise<Response> {
  try {
    const { convex } = await requireAuthedConvex(request);

    const sessionId = request.nextUrl.searchParams.get("sessionId");
    const duplicates = await collectPagedItems(async (cursor) => {
      const page = await convex.query(api.imports.listDuplicates, {
        sessionExternalId: sessionId ?? undefined,
        status: "pending",
        cursor,
        limit: EXPORT_BATCH,
      });
      return {
        items: page.duplicates,
        isDone: page.isDone,
        nextCursor: page.nextCursor,
      };
    });

    return NextResponse.json({
      duplicates,
      total: duplicates.length,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("Get duplicates error:", error);
    return NextResponse.json({ ...apiErrorBody("Failed to fetch duplicates") },
      { status: 500 },
    );
  }
}

async function handlePOST(request: NextRequest): Promise<Response> {
  try {
    const { convex } = await requireAuthedConvex(request);

    const body = (await request.json()) as {
      duplicateId?: string;
      action?: string;
    };
    const { duplicateId, action } = body;

    if (!duplicateId || !action) {
      return NextResponse.json({ ...apiErrorBody("Missing duplicateId or action") },
        { status: 400 },
      );
    }

    if (action !== "merged" && action !== "kept_both" && action !== "rejected") {
      return NextResponse.json({ ...apiErrorBody("Invalid action") }, { status: 400 });
    }

    try {
      const result = await convex.mutation(api.imports.resolveDuplicate, {
        externalId: duplicateId,
        action,
      });
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (/not found/i.test(message)) {
        return NextResponse.json({ ...apiErrorBody("Duplicate not found") },
          { status: 404 },
        );
      }
      throw error;
    }
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("Resolve duplicate error:", error);
    return NextResponse.json({ ...apiErrorBody("Failed to resolve duplicate") },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
export const POST = withRateLimit(handlePOST);
