/**
 * POST /api/invoices/[id]/issue — sign and issue a draft invoice.
 * Protected: authentication + client-scoped RLS via signAndIssueInvoice.
 */

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

async function handlePOST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { convex } = await requireAuthedConvex(request);
    await convex.mutation(api.invoices.issueMine, { externalId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("[Issue Invoice Error]", error);
    const raw = error instanceof Error ? error.message : "";
    const { message, ref } = toFriendlyError(error, "We couldn't issue this invoice. Please try again.");
    const gated =
      raw.includes("Select a client before issuing") ||
      raw.includes("Add your business name in Settings before issuing");
    return NextResponse.json({ error: message, ref }, { status: gated ? 400 : 500 });
  }
}

export const POST = withRateLimit(
  withAudit(handlePOST, { action: "update", resourceType: "invoices" }),
);
