import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const { id: formId } = await params;
    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 },
      );
    }

    const form = await convex.query(api.forms.getMine, { externalId: formId });
    if (!form) {
      return NextResponse.json(
        { error: "Form not found or access denied" },
        { status: 404 },
      );
    }
    if (!form.pdf_url) {
      return NextResponse.json(
        { error: "PDF not available for this form" },
        { status: 404 },
      );
    }

    await convex.mutation(api.forms.appendDownloadAudit, {
      externalId: formId,
    });

    return NextResponse.json({
      success: true,
      formId: form.id,
      formType: form.form_type,
      taxYear: form.tax_year,
      pdfUrl: form.pdf_url,
      fileName: `NRS_${form.form_type}_${form.tax_year}_${form.id.slice(0, 8)}.pdf`,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Form download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
