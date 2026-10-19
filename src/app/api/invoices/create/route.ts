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
import { apiErrorBody, friendlyErrorBody } from "@/lib/friendly-error";

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);

    const body = await request.json();
    const parsed = createInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ ...apiErrorBody("Invalid input"), details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      client_id,
      title,
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
      title,
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
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    return NextResponse.json(
      friendlyErrorBody(error, "We couldn't create this invoice. Please try again.", {
        context: "invoices:create",
      }),
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(
  withAudit(handlePOST, { action: "create", resourceType: "invoices" }),
);
