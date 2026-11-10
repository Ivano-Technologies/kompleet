import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { z } from "zod";
import { apiErrorBody } from "@/lib/friendly-error";

const preferencesSchema = z.object({
  enabled: z.boolean().optional(),
  email: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  inApp: z.boolean().optional(),
});

function toResponse(emailEnabled: boolean) {
  return {
    success: true,
    preferences: {
      enabled: emailEnabled,
      email: emailEnabled,
      inApp: false,
      emailEnabled,
    },
  };
}

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const prefs = await convex.query(api.reminders.getMine, {});
    return NextResponse.json(toResponse(prefs.emailEnabled));
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    return NextResponse.json({ ...apiErrorBody("Internal server error") },
      { status: 500 },
    );
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ...apiErrorBody("Invalid input"), details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const emailEnabled =
      parsed.data.emailEnabled ??
      parsed.data.email ??
      parsed.data.enabled;
    if (typeof emailEnabled !== "boolean") {
      return NextResponse.json({ ...apiErrorBody("Invalid input") }, { status: 400 });
    }
    const prefs = await convex.mutation(api.reminders.updateMine, {
      emailEnabled,
    });
    return NextResponse.json({
      ...toResponse(prefs.emailEnabled),
      message: "Thanks, we saved your notification preferences.",
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
export const POST = withRateLimit(handlePOST);
