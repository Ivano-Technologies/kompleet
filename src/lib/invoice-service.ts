import { resolveInvoiceSender } from "@/lib/invoices/invoice-branding";
import { lineNetAmount, totalsFromLines } from "@/lib/invoices/line-amounts";
import { loadPdfLogo, renderInvoicePdf } from "@/lib/invoices/invoice-pdf";
import { api } from "@/lib/convex/http";
import { requireAuthedConvex } from "@/lib/convex/server";

// ============================================
// Types & Interfaces
// ============================================

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number; // 0 or 7.5
  discount?: number;
  amount: number;
}

export interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tin?: string; // Tax Identification Number
}

export interface InvoiceData {
  user_id: string;
  client_id: string;
  tax_year: number;
  customer_info: CustomerInfo;
  line_items: InvoiceLineItem[];
  invoice_date: string; // YYYY-MM-DD
  due_date?: string;
  payment_terms?: string;
  notes?: string;
  template_id?: string;
}

export interface InvoiceCalculation {
  subtotal: number;
  vat_amount: number;
  discount_amount: number;
  total_amount: number;
}

// ============================================
// VAT Calculation Service
// ============================================

/** Pre-VAT line amount (quantity x rate minus line discount). See line-amounts.ts. */
export function calculateLineItemAmount(item: InvoiceLineItem): number {
  return lineNetAmount(item);
}

export function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[],
): InvoiceCalculation {
  return totalsFromLines(lineItems);
}

// ============================================
// Invoice Number Generation
// ============================================

export async function getNextInvoiceNumber(
  clientId: string,
  taxYear: number,
): Promise<string> {
  const { convex } = await requireAuthedConvex();
  return convex.mutation(api.invoices.nextNumber, {
    clientExternalId: clientId,
    taxYear,
  });
}

// ============================================
// Invoice Issuance (Make Immutable)
// ============================================

export async function issueInvoice(invoiceId: string): Promise<void> {
  const { convex } = await requireAuthedConvex();
  await convex.mutation(api.invoices.issueMine, { externalId: invoiceId });
}

// ============================================
// PDF Generation Service
// ============================================

function asCustomerInfo(value: unknown): CustomerInfo {
  if (!value || typeof value !== "object") {
    return { name: "" };
  }
  const row = value as Record<string, unknown>;
  const structured = [
    typeof row.addressLine1 === "string" ? row.addressLine1 : "",
    typeof row.addressLine2 === "string" ? row.addressLine2 : "",
    [row.city, row.state, row.country].filter((part) => typeof part === "string" && part).join(", "),
  ]
    .filter(Boolean)
    .join("\n");
  return {
    name: typeof row.name === "string" ? row.name : "",
    email: typeof row.email === "string" ? row.email : undefined,
    phone: typeof row.phone === "string" ? row.phone : undefined,
    address:
      typeof row.address === "string" && row.address
        ? row.address
        : structured || undefined,
    tin: typeof row.tin === "string" ? row.tin : undefined,
  };
}

function asLineItems(value: unknown): InvoiceLineItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const row =
      item && typeof item === "object"
        ? (item as Record<string, unknown>)
        : {};
    return {
      description: typeof row.description === "string" ? row.description : "",
      quantity: typeof row.quantity === "number" ? row.quantity : 0,
      unit_price: typeof row.unit_price === "number" ? row.unit_price : 0,
      vat_rate: typeof row.vat_rate === "number" ? row.vat_rate : 0,
      discount: typeof row.discount === "number" ? row.discount : undefined,
      amount: typeof row.amount === "number" ? row.amount : 0,
    };
  });
}

function extraString(invoice: Record<string, unknown>, key: string): string | undefined {
  const value = invoice[key];
  return typeof value === "string" ? value : undefined;
}

function extraNumber(invoice: Record<string, unknown>, key: string): number {
  const value = invoice[key];
  return typeof value === "number" ? value : 0;
}

export async function generateInvoicePDF(invoiceId: string): Promise<Buffer> {
  const { convex } = await requireAuthedConvex();
  const invoice = await convex.query(api.invoices.getMine, {
    externalId: invoiceId,
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const invoiceExtras = invoice as Record<string, unknown>;
  // getMine already returns the issue time snapshot for issued invoices and
  // the live business profile for drafts (IVA-185).
  const sender = resolveInvoiceSender(invoice, null);
  const logo = await loadPdfLogo(sender.logoUrl);

  const doc = renderInvoicePdf({
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date,
    dueDate: invoice.due_date,
    taxYear: invoice.tax_year,
    customer: asCustomerInfo(invoice.customer_info),
    sender,
    lineItems: asLineItems(invoice.line_items),
    subtotal: invoice.subtotal ?? 0,
    vatAmount: invoice.vat_amount ?? 0,
    discountAmount: extraNumber(invoiceExtras, "discount_amount"),
    totalAmount: invoice.total_amount ?? 0,
    paymentTerms: extraString(invoiceExtras, "payment_terms"),
    notes: invoice.notes,
    signatureHash: extraString(invoiceExtras, "signature_hash"),
    logo,
  });

  return Buffer.from(doc.output("arraybuffer"));
}

// ============================================
// Helper Functions
// ============================================

export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function validateInvoiceData(data: InvoiceData): string[] {
  const errors: string[] = [];

  if (!data.client_id) {
    errors.push("Client is required");
  }

  if (!data.customer_info.name) {
    errors.push("Customer name is required");
  }

  if (!data.line_items || data.line_items.length === 0) {
    errors.push("At least one line item is required");
  }

  for (let i = 0; i < data.line_items.length; i++) {
    const item = data.line_items[i];
    if (!item.description) {
      errors.push(`Line item ${i + 1}: Description is required`);
    }
    if (item.quantity <= 0) {
      errors.push(`Line item ${i + 1}: Quantity must be greater than 0`);
    }
    if (item.unit_price < 0) {
      errors.push(`Line item ${i + 1}: Unit price cannot be negative`);
    }
    if (![0, 7.5].includes(item.vat_rate)) {
      errors.push(`Line item ${i + 1}: VAT rate must be 0% or 7.5%`);
    }
  }

  return errors;
}
