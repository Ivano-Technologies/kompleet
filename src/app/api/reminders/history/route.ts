import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { apiErrorBody } from "@/lib/friendly-error";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const reminders = await convex.query(api.reminders.listMine, {});
    return NextResponse.json({
      success: true,
      reminders,
      count: reminders.length,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    return NextResponse.json({ ...apiErrorBody("Internal server error") },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
