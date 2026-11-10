import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { apiErrorBody, toFriendlyError } from "@/lib/friendly-error";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const result = await convex.mutation(api.sessions.revokeAllMine, {});
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    const { message, ref } = toFriendlyError(error);
    return NextResponse.json({ error: message, ref }, { status: 400 });
  }
}

export const POST = withRateLimit(handlePOST, { limit: 10, window: 3_600_000 });
