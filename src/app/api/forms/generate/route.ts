import { withRateLimit } from "@/lib/with-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createClient } from "@/lib/supabase/server";
import {
  generatePITForm,
  generateCITForm,
  generateVATForm,
} from "@/lib/nrs-forms";
import { z } from "zod";

const formGenerateSchema = z.object({
  formType: z.enum(["PIT", "CIT", "VAT"]),
  taxYear: z.number().int().min(2000).max(2100),
  formData: z.record(z.string(), z.any()),
});

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = formGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { formType, taxYear, formData } = parsed.data;

    // Generate PDF based on form type
    let pdf;
    try {
      switch (formType) {
        case "PIT":
          pdf = generatePITForm(formData as any);
          break;
        case "CIT":
          pdf = generateCITForm(formData as any);
          break;
        case "VAT":
          pdf = generateVATForm(formData as any);
          break;
        default:
          throw new Error("Invalid form type");
      }
    } catch (pdfError) {
      console.error("PDF generation error:", pdfError);
      return NextResponse.json(
        { error: "Failed to generate PDF form" },
        { status: 500 },
      );
    }

    // Convert PDF to base64
    const pdfOutput = pdf.output("datauristring");

    // Save form record to database
    const { data: formRecord, error: dbError } = await supabase
      .from("nrs_forms")
      .insert({
        user_id: user.id,
        form_type: formType,
        tax_year: taxYear,
        form_data: formData,
        pdf_url: pdfOutput,
        status: "generated",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save form record" },
        { status: 500 },
      );
    }

    // Log audit trail
    await supabase.from("filing_audit_logs").insert({
      user_id: user.id,
      action: "FORM_GENERATED",
      form_id: formRecord.id,
      details: {
        form_type: formType,
        tax_year: taxYear,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      formId: formRecord.id,
      pdfUrl: pdfOutput,
      message: `${formType} form generated successfully`,
    });
  } catch (error) {
    console.error("Form generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Apply rate limiting
export const POST = withRateLimit(handlePOST, { limit: 20 });
