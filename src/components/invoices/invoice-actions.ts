import type { InvoiceClient } from "./CustomerCombobox";

export async function createInvoiceDraft(input: {
  client: InvoiceClient;
  amount: number;
  addVat: boolean;
  description?: string;
  notes?: string;
}): Promise<{ invoice_id: string; invoice_number?: string }> {
  const vatRate = input.addVat ? 7.5 : 0;
  const description = input.description?.trim() || "Services";
  const today = new Date().toISOString().split("T")[0] ?? "";

  const response = await fetch("/api/invoices/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      client_id: input.client.id,
      tax_year: new Date().getFullYear(),
      customer_info: {
        name: input.client.legal_name,
        email: input.client.email || "",
        phone: input.client.phone || "",
      },
      line_items: [
        {
          description,
          quantity: 1,
          unit_price: input.amount,
          vat_rate: vatRate,
          discount: 0,
        },
      ],
      invoice_date: today,
      notes: input.notes,
    }),
  });

  const body = (await response.json()) as {
    invoice_id?: string;
    invoice_number?: string;
    error?: string;
  };
  if (!response.ok || !body.invoice_id) {
    throw new Error(body.error || "Failed to create invoice");
  }
  return { invoice_id: body.invoice_id, invoice_number: body.invoice_number };
}

export async function issueInvoice(invoiceId: string): Promise<void> {
  const response = await fetch(`/api/invoices/${invoiceId}/issue`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Failed to issue invoice");
  }
}

export async function ensureClientFromName(name: string): Promise<InvoiceClient> {
  const legalName = name.trim() || "New customer";
  const response = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ legal_name: legalName }),
  });
  const body = (await response.json()) as {
    client?: InvoiceClient;
    error?: string;
  };
  if (!response.ok || !body.client) {
    throw new Error(body.error || "Failed to create client");
  }
  return body.client;
}

export function clientNameFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return base || "New customer";
}
