import type { EmailTemplate } from "@/lib/email-service";
import { senderPartyFromUnknown } from "@/lib/invoices/invoice-branding";

export const INVOICE_EMAIL_NEEDS_BUSINESS =
  "Add your business name in Settings before sending.";

export function invoiceRecipientEmail(customerInfo: unknown): string | null {
  if (!customerInfo || typeof customerInfo !== "object") return null;
  const email = (customerInfo as { email?: unknown }).email;
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  return trimmed.includes("@") ? trimmed : null;
}

export function invoiceBusinessName(sender: unknown): string | null {
  const name = senderPartyFromUnknown(sender)?.name.trim() ?? "";
  return name.length > 0 ? name : null;
}

export function formatInvoiceNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const INVOICE_EMAIL_REPLY_PROMPT =
  "Reply to this email if you have questions.";

export function invoiceEmailTemplate(input: {
  invoiceNumber: string;
  totalAmount: number;
  businessName: string;
  attachedPdf?: boolean;
  includeReplyPrompt?: boolean;
}): EmailTemplate {
  const business = input.businessName.trim();
  if (!business) {
    throw new Error("Business name is required to send an invoice email.");
  }
  const total = formatInvoiceNaira(input.totalAmount);
  const ready = `Invoice ${input.invoiceNumber} for ${total} from ${business} is ready.`;
  const pdfLine = input.attachedPdf ? " The invoice PDF is attached." : "";
  const reply = input.includeReplyPrompt
    ? ` ${INVOICE_EMAIL_REPLY_PROMPT}`
    : "";
  const body = `${ready}${pdfLine}${reply}`;
  const subject = `Invoice ${input.invoiceNumber} from ${business}`;
  const html = `<p>Invoice <strong>${escapeHtml(input.invoiceNumber)}</strong> for <strong>${escapeHtml(total)}</strong> from <strong>${escapeHtml(business)}</strong> is ready.${input.attachedPdf ? " The invoice PDF is attached." : ""}${reply}</p>`;
  return { subject, text: body, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
