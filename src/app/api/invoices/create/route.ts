import { NextRequest, NextResponse } from "next/server";
import { calculateInvoiceTotals } from "@/lib/invoice-service";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { createInvoiceSchema } from "@/lib/schemas/invoices";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      client_id,
      tax_year,
      customer_info,
      line_items,
      invoice_date,
      due_date,
      notes,
    } = parsed.data;

    const items = line_items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      vat_rate: item.vat_rate,
      discount: item.discount,
      amount:
        item.amount ??
        item.quantity * item.unit_price - (item.discount ?? 0),
    }));
    const totals = calculateInvoiceTotals(items);

    const invoice = await convex.mutation(api.invoices.createMine, {
      clientExternalId: client_id,
      taxYear: tax_year ?? new Date().getFullYear(),
      customerInfo: customer_info,
      lineItems: items,
      invoiceDate: invoice_date || new Date().toISOString().split("T")[0],
      dueDate: due_date,
      notes,
      subtotal: totals.subtotal,
      vatAmount: totals.vat_amount,
      totalAmount: totals.total_amount,
      status: "draft",
    });

    return NextResponse.json(
      {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
      },
      { status: 201 },
    );
  } catch (error: any) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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
        ...(code ? { code } : {}),
      },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(
  withAudit(handlePOST, { action: "create", resourceType: "invoices" }),
);
