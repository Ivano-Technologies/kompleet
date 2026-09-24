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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Issue Invoice Error]", error);
    const message =
      error instanceof Error ? error.message : "Failed to issue invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withRateLimit(
  withAudit(handlePOST, { action: "update", resourceType: "invoices" }),
);
