import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
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

export function calculateLineItemAmount(item: InvoiceLineItem): number {
  const baseAmount = item.quantity * item.unit_price;
  const discountAmount = item.discount || 0;
  const subtotal = baseAmount - discountAmount;
  const vatAmount = (subtotal * item.vat_rate) / 100;
  return Number((subtotal + vatAmount).toFixed(2));
}

export function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[],
): InvoiceCalculation {
  let subtotal = 0;
  let vatAmount = 0;
  let discountAmount = 0;

  for (const item of lineItems) {
    const baseAmount = item.quantity * item.unit_price;
    const itemDiscount = item.discount || 0;
    const itemSubtotal = baseAmount - itemDiscount;
    const itemVat = (itemSubtotal * item.vat_rate) / 100;

    subtotal += itemSubtotal;
    vatAmount += itemVat;
    discountAmount += itemDiscount;
  }

  // Round to 2 decimal places (Nigerian Naira)
  subtotal = Number(subtotal.toFixed(2));
  vatAmount = Number(vatAmount.toFixed(2));
  discountAmount = Number(discountAmount.toFixed(2));
  const totalAmount = Number((subtotal + vatAmount).toFixed(2));

  return {
    subtotal,
    vat_amount: vatAmount,
    discount_amount: discountAmount,
    total_amount: totalAmount,
  };
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
// Invoice Creation Service
// ============================================

export async function createInvoice(
  invoiceData: InvoiceData,
): Promise<{ id: string; invoice_number: string }> {
  const { convex } = await requireAuthedConvex();
  const totals = calculateInvoiceTotals(invoiceData.line_items);
  const invoiceDate =
    invoiceData.invoice_date || new Date().toISOString().split("T")[0];
  const created = await convex.mutation(api.invoices.createMine, {
    invoiceDate,
    dueDate: invoiceData.due_date,
    taxYear: invoiceData.tax_year,
    clientExternalId: invoiceData.client_id,
    customerInfo: invoiceData.customer_info,
    lineItems: invoiceData.line_items,
    subtotal: totals.subtotal,
    vatAmount: totals.vat_amount,
    totalAmount: totals.total_amount,
    status: "draft",
    notes: invoiceData.notes,
  });
  return { id: created.id, invoice_number: created.invoice_number };
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
  return {
    name: typeof row.name === "string" ? row.name : "",
    email: typeof row.email === "string" ? row.email : undefined,
    phone: typeof row.phone === "string" ? row.phone : undefined,
    address: typeof row.address === "string" ? row.address : undefined,
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

function formatInvoiceDate(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-NG");
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
  const customer = asCustomerInfo(invoice.customer_info);
  const lineItems = asLineItems(invoice.line_items);
  const subtotal = invoice.subtotal ?? 0;
  const vatAmount = invoice.vat_amount ?? 0;
  const totalAmount = invoice.total_amount ?? 0;
  const discountAmount = extraNumber(invoiceExtras, "discount_amount");
  const paymentTerms = extraString(invoiceExtras, "payment_terms");
  const qrPayload = extraString(invoiceExtras, "qr_payload");
  const signatureHash = extraString(invoiceExtras, "signature_hash");

  // Create PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors (Nigerian green branding)
  const primaryColor: [number, number, number] = [10, 104, 71]; // #0A6847
  const textColor: [number, number, number] = [0, 0, 0];
  const grayColor: [number, number, number] = [128, 128, 128];

  // ============================================
  // Header Section
  // ============================================
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 15, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("KOMPLEET Platform", pageWidth - 15, 15, { align: "right" });
  doc.text("Tax Compliance & E-Invoicing", pageWidth - 15, 20, {
    align: "right",
  });
  doc.text("Nigeria", pageWidth - 15, 25, { align: "right" });

  // ============================================
  // Invoice Details
  // ============================================
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  let yPos = 55;

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Number:", 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoice_number, 60, yPos);

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Invoice Date:", 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(formatInvoiceDate(invoice.invoice_date), 60, yPos);

  if (invoice.due_date) {
    yPos += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Due Date:", 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(invoice.due_date).toLocaleDateString("en-NG"), 60, yPos);
  }

  yPos += 7;
  doc.setFont("helvetica", "bold");
  doc.text("Tax Year:", 15, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(String(invoice.tax_year ?? ""), 60, yPos);

  // ============================================
  // Customer Details
  // ============================================
  yPos += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Bill To:", 15, yPos);

  yPos += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(customer.name, 15, yPos);

  if (customer.email) {
    yPos += 5;
    doc.text(customer.email, 15, yPos);
  }

  if (customer.phone) {
    yPos += 5;
    doc.text(customer.phone, 15, yPos);
  }

  if (customer.address) {
    yPos += 5;
    const addressLines = doc.splitTextToSize(customer.address, 80);
    doc.text(addressLines, 15, yPos);
    yPos += addressLines.length * 5;
  }

  if (customer.tin) {
    yPos += 5;
    doc.text(`TIN: ${customer.tin}`, 15, yPos);
  }

  // ============================================
  // Line Items Table
  // ============================================
  yPos += 15;

  const tableData = lineItems.map((item: InvoiceLineItem) => [
    item.description,
    item.quantity.toString(),
    `₦${item.unit_price.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `${item.vat_rate}%`,
    item.discount
      ? `₦${item.discount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "-",
    `₦${item.amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Description", "Qty", "Unit Price", "VAT", "Discount", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: "center", cellWidth: 15 },
      2: { halign: "right", cellWidth: 25 },
      3: { halign: "center", cellWidth: 15 },
      4: { halign: "right", cellWidth: 25 },
      5: { halign: "right", cellWidth: 30 },
    },
  });

  // Get final Y position after table
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ============================================
  // Totals Section
  // ============================================
  const totalsX = pageWidth - 70;

  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", totalsX, yPos, { align: "right" });
  doc.text(
    `₦${subtotal.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth - 15,
    yPos,
    { align: "right" },
  );

  yPos += 7;
  doc.text("VAT (7.5%):", totalsX, yPos, { align: "right" });
  doc.text(
    `₦${vatAmount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth - 15,
    yPos,
    { align: "right" },
  );

  if (discountAmount > 0) {
    yPos += 7;
    doc.text("Discount:", totalsX, yPos, { align: "right" });
    doc.text(
      `-₦${discountAmount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pageWidth - 15,
      yPos,
      { align: "right" },
    );
  }

  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", totalsX, yPos, { align: "right" });
  doc.text(
    `₦${totalAmount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth - 15,
    yPos,
    { align: "right" },
  );

  // ============================================
  // Payment Terms & Notes
  // ============================================
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  if (paymentTerms) {
    doc.setFont("helvetica", "bold");
    doc.text("Payment Terms:", 15, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    const termsLines = doc.splitTextToSize(paymentTerms, pageWidth - 30);
    doc.text(termsLines, 15, yPos);
    yPos += termsLines.length * 5 + 5;
  }

  if (invoice.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 15, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 30);
    doc.text(notesLines, 15, yPos);
    yPos += notesLines.length * 5;
  }

  // ============================================
  // Footer with QR Code (if available)
  // ============================================
  if (qrPayload) {
    try {
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 80,
        margin: 1,
      });
      doc.addImage(qrDataUrl, "PNG", 15, pageHeight - 50, 30, 30);

      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text("Scan to verify", 15, pageHeight - 15);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }

  // Digital signature indicator
  if (signatureHash) {
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text("Digitally Signed", pageWidth - 15, pageHeight - 20, {
      align: "right",
    });
    doc.text(
      `Signature: ${signatureHash.substring(0, 16)}...`,
      pageWidth - 15,
      pageHeight - 15,
      { align: "right" },
    );
  }

  // Footer text with tagline
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(
    "Generated by KOMPLEET Platform - NRS-Compliant E-Invoicing",
    pageWidth / 2,
    pageHeight - 15,
    {
      align: "center",
    },
  );
  doc.setFontSize(7);
  doc.text(
    "Kompleet records. Kompleet filings. Kompleet compliance.",
    pageWidth / 2,
    pageHeight - 10,
    {
      align: "center",
    },
  );

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
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
