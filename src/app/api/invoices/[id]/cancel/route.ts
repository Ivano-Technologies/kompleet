import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { toFriendlyError, apiErrorBody } from "@/lib/friendly-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isForbidden(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const data = (error as { data?: unknown }).data;
  if (data === "FORBIDDEN") return true;
  return Boolean(
    data &&
      typeof data === "object" &&
      (data as { code?: unknown }).code === "FORBIDDEN",
  );
}

async function handlePOST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { convex } = await requireAuthedConvex(request);
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    await convex.mutation(api.invoices.cancelMine, {
      externalId: id,
      reason: typeof body.reason === "string" ? body.reason : "",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    if (isForbidden(error)) {
      const { message, ref } = toFriendlyError(
        error,
        "You can't change this invoice.",
      );
      return NextResponse.json({ error: message, ref }, { status: 403 });
    }
    const { message, ref } = toFriendlyError(
      error,
      "We couldn't cancel this invoice. Please try again.",
    );
    return NextResponse.json({ error: message, ref }, { status: 400 });
  }
}

export const POST = withRateLimit(
  withAudit(handlePOST, { action: "update", resourceType: "invoices" }),
);
