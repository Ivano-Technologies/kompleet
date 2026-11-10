import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";
import { collectPagedItems, EXPORT_BATCH } from "@/lib/convex/collect-pages";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const history = await collectPagedItems(
      async (cursor) => {
        const page = await convex.query(api.exports.listMine, {
          cursor,
          limit: EXPORT_BATCH,
        });
        return {
          items: page.history,
          isDone: page.isDone,
          nextCursor: page.nextCursor,
        };
      },
    );
    return NextResponse.json({ history });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("Error in /api/export/history:", error);
    return NextResponse.json({ ...apiErrorBody("Internal server error") },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
