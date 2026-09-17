/**
 * POST /api/invoices/[id]/issue — sign and issue a draft invoice.
 * Protected: authentication + client-scoped RLS via signAndIssueInvoice.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { signAndIssueInvoice } from "@/lib/invoice-security";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handlePOST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await getSupabaseForRequest(request);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await signAndIssueInvoice(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Issue Invoice Error]", error);
    const message =
      error instanceof Error ? error.message : "Failed to issue invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = withRateLimit(
  withAudit(handlePOST, { action: "update", resourceType: "invoices" }),
);
