import { withRateLimit } from "@/lib/with-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import {
  generatePITForm,
  generateCITForm,
  generateVATForm,
} from "@/lib/nrs-forms";
import { z } from "zod";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

const formGenerateSchema = z.object({
  formType: z.enum(["PIT", "CIT", "VAT"]),
  taxYear: z.number().int().min(2000).max(2100),
  formData: z.record(z.string(), z.unknown()),
});

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const parsed = formGenerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { formType, taxYear, formData } = parsed.data;

    let pdf;
    try {
      switch (formType) {
        case "PIT":
          pdf = generatePITForm(formData as never);
          break;
        case "CIT":
          pdf = generateCITForm(formData as never);
          break;
        case "VAT":
          pdf = generateVATForm(formData as never);
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

    const pdfOutput = pdf.output("datauristring");
    const formRecord = await convex.mutation(api.forms.createMine, {
      formType,
      taxYear,
      formData,
      pdfUrl: pdfOutput,
      status: "generated",
    });

    return NextResponse.json({
      success: true,
      formId: formRecord.id,
      pdfUrl: pdfOutput,
      message: `${formType} form generated successfully`,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Form generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 20 });
