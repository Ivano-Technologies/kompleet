/**
 * POST /api/invoices/[id]/send — email an issued invoice to the client.
 * Attaches a server-generated PDF when generation succeeds.
 * Does not send when RESEND_API_KEY is unset (returns sent: false).
 */

import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { withAudit } from "@/lib/with-audit";
import { api } from "@/lib/convex/http";
import {
  isUnauthorized,
  requireAuthedConvex,
} from "@/lib/convex/server";
import { contactReplyTo } from "@/lib/contact-email";
import { sendEmail } from "@/lib/email-service";
import { generateInvoicePDF } from "@/lib/invoice-service";
import { toFriendlyError, apiErrorBody } from "@/lib/friendly-error";
import {
  INVOICE_EMAIL_NEEDS_BUSINESS,
  invoiceBusinessName,
  invoiceEmailTemplate,
  invoiceRecipientEmail,
} from "@/lib/invoices/invoice-email";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function tryInvoicePdf(
  id: string,
  request: NextRequest,
): Promise<Buffer | null> {
  try {
    return await generateInvoicePDF(id, request);
  } catch {
    return null;
  }
}

function pdfFilename(invoiceNumber: string): string {
  const safe = invoiceNumber.replace(/[^\w.-]+/g, "-") || "invoice";
  return `${safe}.pdf`;
}

async function handlePOST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { convex, user } = await requireAuthedConvex(request);
    const invoice = await convex.query(api.invoices.getMine, {
      externalId: id,
    });
    if (!invoice) {
      return NextResponse.json({ ...apiErrorBody("Invoice not found") }, { status: 404 });
    }
    if (invoice.status === "draft") {
      return NextResponse.json(
        { ...apiErrorBody("Issue the invoice before sending.") },
        { status: 400 },
      );
    }
    if (invoice.status === "cancelled") {
      return NextResponse.json(
        { ...apiErrorBody("Cancelled invoices cannot be emailed.") },
        { status: 400 },
      );
    }
    const to = invoiceRecipientEmail(invoice.customer_info);
    if (!to) {
      return NextResponse.json(
        { ...apiErrorBody("Add a client email before sending.") },
        { status: 400 },
      );
    }
    const businessName = invoiceBusinessName(invoice.sender);
    if (!businessName) {
      return NextResponse.json(
        { ...apiErrorBody(INVOICE_EMAIL_NEEDS_BUSINESS) },
        { status: 400 },
      );
    }
    const pdf = await tryInvoicePdf(id, request);
    const replyTo = contactReplyTo(user?.email);
    const sent = await sendEmail(
      to,
      invoiceEmailTemplate({
        invoiceNumber: invoice.invoice_number,
        totalAmount: invoice.total_amount ?? 0,
        businessName,
        attachedPdf: Boolean(pdf),
        includeReplyPrompt: Boolean(replyTo),
      }),
      pdf
        ? [
            {
              filename: pdfFilename(invoice.invoice_number),
              content: pdf.toString("base64"),
            },
          ]
        : undefined,
      replyTo,
    );
    return NextResponse.json({
      sent,
      to,
      attachedPdf: Boolean(pdf),
      error: sent
        ? undefined
        : "We couldn't send the invoice email. Download the PDF and share it instead.",
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ ...apiErrorBody("Unauthorized") }, { status: 401 });
    }
    const { message, ref } = toFriendlyError(
      error,
      "We couldn't send the invoice email. Download the PDF and share it instead.",
    );
    return NextResponse.json({ error: message, ref, sent: false }, { status: 500 });
  }
}

export const POST = withRateLimit(
  withAudit(handlePOST, { action: "update", resourceType: "invoices" }),
  { limit: 20 },
);
