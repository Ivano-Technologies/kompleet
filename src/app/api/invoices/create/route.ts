import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { createInvoice } from "@/lib/invoice-service";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { createInvoiceSchema } from "@/lib/schemas/invoices";

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      tax_year,
      customer_info,
      line_items,
      invoice_date,
      due_date,
      payment_terms,
      notes,
    } = parsed.data;

    // Create invoice (pass supabase so we use the same authenticated session)
    const invoice = await createInvoice(
      {
        user_id: user.id,
        tax_year: tax_year ?? new Date().getFullYear(),
        customer_info,
        line_items,
        invoice_date: invoice_date || new Date().toISOString().split("T")[0],
        due_date,
        payment_terms,
        notes,
      } as any,
      supabase,
    );

    return NextResponse.json(
      {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    const message =
      error?.message ||
      error?.error_description ||
      (typeof error === "string" ? error : "Failed to create invoice");
    const code = error?.code;
    return NextResponse.json(
      {
        error: message,
        details: error?.details,
        ...(code && { code }),
      },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(
  withAudit(handlePOST, { action: "create", resourceType: "invoices" }),
);
