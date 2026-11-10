import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { generateInvoicePDF } from "@/lib/invoice-service";
import { hasLegalName, type BusinessProfile } from "@/lib/invoices/profiles";
import { toFriendlyError, apiErrorBody } from "@/lib/friendly-error";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function handleGET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { convex } = await requireAuthedConvex(request);
    const profile = (await convex.query(
      api.tenancy.getMyBusinessProfile,
      {},
    )) as BusinessProfile;
    if (!hasLegalName(profile)) {
      return NextResponse.json({ ...apiErrorBody("Add your business name in Settings before issuing.") },
        { status: 400 },
      );
    }
    const pdf = await generateInvoicePDF(id, request);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${id}.pdf"`,
      },
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    const { message, ref } = toFriendlyError(error, "We couldn't generate the PDF. Please try again.");
    return NextResponse.json({ error: message, ref }, { status: 500 });
  }
}

export const GET = withRateLimit(handleGET);
