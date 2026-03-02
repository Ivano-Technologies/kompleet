export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceEntity {
  invoiceNumber: string;
  vendorName: string;
  issueDate: string;
  currency: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  lineItems: InvoiceLineItem[];
}
