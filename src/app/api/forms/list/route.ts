import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";
import { collectPagedItems, EXPORT_BATCH } from "@/lib/convex/collect-pages";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const searchParams = request.nextUrl.searchParams;
    const forms = await collectPagedItems(
      async (cursor) => {
        const page = await convex.query(api.forms.listMine, {
          formType: searchParams.get("formType") ?? undefined,
          taxYear: searchParams.get("taxYear")
            ? parseInt(searchParams.get("taxYear")!, 10)
            : undefined,
          status: searchParams.get("status") ?? undefined,
          cursor,
          limit: EXPORT_BATCH,
        });
        return {
          items: page.forms,
          isDone: page.isDone,
          nextCursor: page.nextCursor,
        };
      },
    );

    return NextResponse.json({
      success: true,
      forms,
      count: forms.length,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("List forms error:", error);
    return NextResponse.json({ ...apiErrorBody("Internal server error") },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
