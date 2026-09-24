// TODO(IVA-64 Phase 5): reminder_preferences is not on Convex users. Do not invent columns.
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { z } from "zod";

const DEFAULT_PREFERENCES = {
  enabled: true,
  email: true,
  inApp: true,
};

const preferencesSchema = z.object({
  enabled: z.boolean(),
  email: z.boolean(),
  inApp: z.boolean(),
});

async function handleGET(request: NextRequest) {
  try {
    await requireAuthedConvex(request);
    return NextResponse.json({
      success: true,
      preferences: DEFAULT_PREFERENCES,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function handlePOST(request: NextRequest) {
  try {
    await requireAuthedConvex(request);
    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Notification preferences accepted (not persisted on Convex yet)",
      preferences: parsed.data,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
export const POST = withRateLimit(handlePOST);
