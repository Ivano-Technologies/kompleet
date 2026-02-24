import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/with-rate-limit";

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await getSupabaseForRequest(request);

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: formId } = await params;

    // Validate form ID
    if (!formId) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 },
      );
    }

    // Fetch form from database
    const { data: form, error: dbError } = await supabase
      .from("nrs_forms")
      .select("*")
      .eq("id", formId)
      .eq("user_id", user.id)
      .single();

    if (dbError || !form) {
      return NextResponse.json(
        { error: "Form not found or access denied" },
        { status: 404 },
      );
    }

    // Check if PDF URL exists
    if (!form.pdf_url) {
      return NextResponse.json(
        { error: "PDF not available for this form" },
        { status: 404 },
      );
    }

    // Log download action
    await supabase.from("filing_audit_logs").insert({
      user_id: user.id,
      action: "FORM_DOWNLOADED",
      form_id: formId,
      details: {
        form_type: form.form_type,
        tax_year: form.tax_year,
        timestamp: new Date().toISOString(),
      },
    });

    // Return PDF data
    return NextResponse.json({
      success: true,
      formId: form.id,
      formType: form.form_type,
      taxYear: form.tax_year,
      pdfUrl: form.pdf_url,
      fileName: `NRS_${form.form_type}_${form.tax_year}_${form.id.slice(0, 8)}.pdf`,
    });
  } catch (error) {
    console.error("Form download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
