export interface InvoiceCustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tin?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface InvoiceSenderInfo {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  email?: string;
  phone?: string;
  tin?: string;
  vatNumber?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  discount?: number;
  amount: number;
}

export interface InvoiceView {
  id: string;
  invoice_number: string;
  title?: string | null;
  client_id?: string | null;
  status: string;
  tax_year?: number;
  is_immutable?: boolean;
  invoice_date: string;
  due_date?: string | null;
  issued_at?: string | null;
  total_amount: number;
  subtotal: number;
  vat_amount: number;
  discount_amount: number;
  payment_terms?: string | null;
  notes?: string | null;
  signature_hash?: string | null;
  customer_info?: InvoiceCustomerInfo | null;
  sender?: InvoiceSenderInfo | null;
  line_items: InvoiceLineItem[];
}
