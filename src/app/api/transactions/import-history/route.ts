/**
 * Import History API
 * GET /api/transactions/import-history
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const bankCode = searchParams.get("bankCode");
    const status = searchParams.get("status");

    let sessions = await convex.query(api.imports.listMine, {});
    if (bankCode) {
      sessions = sessions.filter(
        (s) => (s.bank_code ?? "").toUpperCase() === bankCode.toUpperCase(),
      );
    }
    if (status) {
      sessions = sessions.filter((s) => s.status === status);
    }

    const total = sessions.length;
    const page = sessions.slice(offset, offset + limit);

    const enrichedSessions = [];
    for (const session of page) {
      const [errors, duplicates] = await Promise.all([
        convex.query(api.imports.listErrors, {
          sessionExternalId: session.id,
        }),
        convex.query(api.imports.listDuplicates, {
          sessionExternalId: session.id,
        }),
      ]);
      enrichedSessions.push({
        ...session,
        errorsCount: errors.length,
        duplicatesCount: duplicates.length,
      });
    }

    return NextResponse.json({
      sessions: enrichedSessions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Import history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch import history" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
