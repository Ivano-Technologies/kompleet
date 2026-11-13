import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { friendlyErrorBody, apiErrorBody } from "@/lib/friendly-error";

export const runtime = "nodejs";

/**
 * IVA-321: replace a VAT report's figures with the VAT computation for its
 * own period. Only runs when the user asks for it on the report page.
 */
async function handlePOST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const { id } = await context.params;
    const report = await convex.mutation(api.tax.regenerateVatReport, {
      externalId: id,
    });
    return NextResponse.json({ report });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    console.error("Error in POST /api/tax-reports/[id]/regenerate:", error);
    return NextResponse.json({ ...friendlyErrorBody(error) }, { status: 400 });
  }
}

export const POST = withRateLimit(handlePOST, { limit: 20 });
