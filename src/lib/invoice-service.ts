import { createServerClient as createClient } from '@/lib/supabase/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

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

export function calculateInvoiceTotals(lineItems: InvoiceLineItem[]): InvoiceCalculation {
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
    total_amount: totalAmount
  };
}

// ============================================
// Invoice Number Generation
// ============================================

export async function getNextInvoiceNumber(
  userId: string,
  taxYear: number
): Promise<string> {
  const supabase = await createClient();

  // Call database function to get next number
  const { data, error } = await supabase.rpc('get_next_invoice_number', {
    p_user_id: userId,
    p_tax_year: taxYear
  });

  if (error) {
    console.error('Error getting next invoice number:', error);
    throw new Error('Failed to generate invoice number');
  }

  return data as string;
}

// ============================================
// Invoice Creation Service
// ============================================

export async function createInvoice(invoiceData: InvoiceData): Promise<{ id: string; invoice_number: string }> {
  const supabase = await createClient();

  // Calculate totals
  const totals = calculateInvoiceTotals(invoiceData.line_items);

  // Get next invoice number
  const invoiceNumber = await getNextInvoiceNumber(
    invoiceData.user_id,
    invoiceData.tax_year
  );

  // Insert invoice
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      user_id: invoiceData.user_id,
      tax_year: invoiceData.tax_year,
      invoice_number: invoiceNumber,
      invoice_date: invoiceData.invoice_date,
      due_date: invoiceData.due_date,
      customer_info: invoiceData.customer_info,
      line_items: invoiceData.line_items,
      subtotal: totals.subtotal,
      vat_amount: totals.vat_amount,
      discount_amount: totals.discount_amount,
      total_amount: totals.total_amount,
      payment_terms: invoiceData.payment_terms,
      notes: invoiceData.notes,
      template_id: invoiceData.template_id,
      status: 'draft'
    })
    .select('id, invoice_number')
    .single();

  if (error) {
    console.error('Error creating invoice:', error);
    throw new Error('Failed to create invoice');
  }

  // Log audit trail
  await supabase.from('invoice_audit_logs').insert({
    invoice_id: data.id,
    user_id: invoiceData.user_id,
    action: 'created',
    metadata: { invoice_number: invoiceNumber }
  });

  return { id: data.id, invoice_number: data.invoice_number };
}

// ============================================
// Invoice Issuance (Make Immutable)
// ============================================

export async function issueInvoice(invoiceId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  // Update invoice status to issued and make immutable
  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'issued',
      issued_at: new Date().toISOString(),
      is_immutable: true
    })
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .eq('status', 'draft');

  if (error) {
    console.error('Error issuing invoice:', error);
    throw new Error('Failed to issue invoice');
  }

  // Log audit trail
  await supabase.from('invoice_audit_logs').insert({
    invoice_id: invoiceId,
    user_id: userId,
    action: 'issued'
  });
}

// ============================================
// PDF Generation Service
// ============================================

export async function generateInvoicePDF(invoiceId: string): Promise<Buffer> {
  const supabase = await createClient();

  // Fetch invoice data
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (error || !invoice) {
    throw new Error('Invoice not found');
  }

  // Create PDF document
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors (Nigerian green branding)
  const primaryColor = [10, 104, 71]; // #0A6847
  const textColor = [0, 0, 0];
  const grayColor = [128, 128, 128];

  // ============================================
  // Header Section
  // ============================================
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 15, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('KOMPLEET Platform', pageWidth - 15, 15, { align: 'right' });
  doc.text('Tax Compliance & E-Invoicing', pageWidth - 15, 20, { align: 'right' });
  doc.text('Nigeria', pageWidth - 15, 25, { align: 'right' });

  // ============================================
  // Invoice Details
  // ============================================
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  let yPos = 55;

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Number:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number, 60, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(invoice.invoice_date).toLocaleDateString('en-NG'), 60, yPos);

  if (invoice.due_date) {
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', 15, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(invoice.due_date).toLocaleDateString('en-NG'), 60, yPos);
  }

  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Tax Year:', 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.tax_year.toString(), 60, yPos);

  // ============================================
  // Customer Details
  // ============================================
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Bill To:', 15, yPos);

  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customer_info.name, 15, yPos);

  if (invoice.customer_info.email) {
    yPos += 5;
    doc.text(invoice.customer_info.email, 15, yPos);
  }

  if (invoice.customer_info.phone) {
    yPos += 5;
    doc.text(invoice.customer_info.phone, 15, yPos);
  }

  if (invoice.customer_info.address) {
    yPos += 5;
    const addressLines = doc.splitTextToSize(invoice.customer_info.address, 80);
    doc.text(addressLines, 15, yPos);
    yPos += addressLines.length * 5;
  }

  if (invoice.customer_info.tin) {
    yPos += 5;
    doc.text(`TIN: ${invoice.customer_info.tin}`, 15, yPos);
  }

  // ============================================
  // Line Items Table
  // ============================================
  yPos += 15;

  const tableData = invoice.line_items.map((item: InvoiceLineItem) => [
    item.description,
    item.quantity.toString(),
    `₦${item.unit_price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `${item.vat_rate}%`,
    item.discount ? `₦${item.discount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
    `₦${item.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qty', 'Unit Price', 'VAT', 'Discount', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 30 }
    }
  });

  // Get final Y position after table
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ============================================
  // Totals Section
  // ============================================
  const totalsX = pageWidth - 70;

  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPos, { align: 'right' });
  doc.text(
    `₦${invoice.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth - 15,
    yPos,
    { align: 'right' }
  );

  yPos += 7;
  doc.text('VAT (7.5%):', totalsX, yPos, { align: 'right' });
  doc.text(
    `₦${invoice.vat_amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth - 15,
    yPos,
    { align: 'right' }
  );

  if (invoice.discount_amount > 0) {
    yPos += 7;
    doc.text('Discount:', totalsX, yPos, { align: 'right' });
    doc.text(
      `-₦${invoice.discount_amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pageWidth - 15,
      yPos,
      { align: 'right' }
    );
  }

  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', totalsX, yPos, { align: 'right' });
  doc.text(
    `₦${invoice.total_amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    pageWidth - 15,
    yPos,
    { align: 'right' }
  );

  // ============================================
  // Payment Terms & Notes
  // ============================================
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (invoice.payment_terms) {
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Terms:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const termsLines = doc.splitTextToSize(invoice.payment_terms, pageWidth - 30);
    doc.text(termsLines, 15, yPos);
    yPos += termsLines.length * 5 + 5;
  }

  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 15, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 30);
    doc.text(notesLines, 15, yPos);
    yPos += notesLines.length * 5;
  }

  // ============================================
  // Footer with QR Code (if available)
  // ============================================
  if (invoice.qr_payload) {
    try {
      const qrDataUrl = await QRCode.toDataURL(invoice.qr_payload, {
        width: 80,
        margin: 1
      });
      doc.addImage(qrDataUrl, 'PNG', 15, pageHeight - 50, 30, 30);
      
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text('Scan to verify', 15, pageHeight - 15);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }

  // Digital signature indicator
  if (invoice.signature_hash) {
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text('Digitally Signed', pageWidth - 15, pageHeight - 20, { align: 'right' });
    doc.text(`Signature: ${invoice.signature_hash.substring(0, 16)}...`, pageWidth - 15, pageHeight - 15, { align: 'right' });
  }

  // Footer text with tagline
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text('Generated by KOMPLEET Platform - NRS-Compliant E-Invoicing', pageWidth / 2, pageHeight - 15, {
    align: 'center'
  });
  doc.setFontSize(7);
  doc.text('Kompleet records. Kompleet filings. Kompleet compliance.', pageWidth / 2, pageHeight - 10, {
    align: 'center'
  });

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

// ============================================
// Helper Functions
// ============================================

export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function validateInvoiceData(data: InvoiceData): string[] {
  const errors: string[] = [];

  if (!data.customer_info.name) {
    errors.push('Customer name is required');
  }

  if (!data.line_items || data.line_items.length === 0) {
    errors.push('At least one line item is required');
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
