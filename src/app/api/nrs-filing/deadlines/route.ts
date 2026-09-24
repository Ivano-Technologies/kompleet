/**
 * Filing Deadlines API
 * GET /api/nrs-filing/deadlines
 * Pure calendar logic — no deadline tables required.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getFilingDeadlines,
  getUpcomingDeadlines,
  getOverdueDeadlines,
  getDeadlineStatus,
  daysUntilDeadline,
  formatDeadline,
} from "@/lib/nrs-filing/deadline-manager";
import { withRateLimit } from "@/lib/with-rate-limit";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleGET(request: NextRequest) {
  try {
    await requireAuthedConvex(request);

    const searchParams = request.nextUrl.searchParams;
    const taxYear = parseInt(
      searchParams.get("taxYear") || new Date().getFullYear().toString(),
      10,
    );
    const filter = searchParams.get("filter");

    const allDeadlines = getFilingDeadlines(taxYear);
    let filteredDeadlines = allDeadlines;
    if (filter === "upcoming") {
      filteredDeadlines = getUpcomingDeadlines(allDeadlines, 30);
    } else if (filter === "overdue") {
      filteredDeadlines = getOverdueDeadlines(allDeadlines);
    }

    const enrichedDeadlines = filteredDeadlines.map((deadline) => ({
      ...deadline,
      status: getDeadlineStatus(deadline),
      daysUntil: daysUntilDeadline(deadline),
      formattedDate: formatDeadline(deadline),
    }));

    return NextResponse.json({
      deadlines: enrichedDeadlines,
      stats: {
        total: allDeadlines.length,
        overdue: getOverdueDeadlines(allDeadlines).length,
        upcoming: getUpcomingDeadlines(allDeadlines, 30).length,
        urgent: getUpcomingDeadlines(allDeadlines, 7).length,
      },
      taxYear,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Get filing deadlines error:", error);
    return NextResponse.json(
      { error: "Failed to fetch filing deadlines" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
