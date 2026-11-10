import type { EmailTemplate } from "@/lib/email-service";

export function invoiceRecipientEmail(customerInfo: unknown): string | null {
  if (!customerInfo || typeof customerInfo !== "object") return null;
  const email = (customerInfo as { email?: unknown }).email;
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  return trimmed.includes("@") ? trimmed : null;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function invoiceEmailTemplate(input: {
  invoiceNumber: string;
  totalAmount: number;
  businessName: string;
}): EmailTemplate {
  const total = formatAmount(input.totalAmount);
  const from = input.businessName.trim() || "your supplier";
  const subject = `Invoice ${input.invoiceNumber} from ${from}`;
  const text = [
    `Invoice ${input.invoiceNumber} for ${total} is ready.`,
    `From: ${from}`,
    "Open the invoice in Kompleet or use the PDF your supplier shared.",
  ].join("\n");
  const html = `<p>Invoice <strong>${escapeHtml(input.invoiceNumber)}</strong> for <strong>${escapeHtml(total)}</strong> is ready.</p><p>From: ${escapeHtml(from)}</p><p>Open the invoice in Kompleet or use the PDF your supplier shared.</p>`;
  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
