import {
  customerInfoFromParty,
  partyFromClient,
  titleFromFile,
  type ClientProfile,
} from "@/lib/invoices/profiles";

export type InvoiceClient = ClientProfile;

export async function createInvoiceDraft(input: {
  client?: InvoiceClient | null;
  amount: number;
  addVat: boolean;
  description?: string;
  notes?: string;
  title?: string;
}): Promise<{ invoice_id: string; invoice_number?: string }> {
  const vatRate = input.addVat ? 7.5 : 0;
  const description = input.description?.trim() || "Services";
  const today = new Date().toISOString().split("T")[0] ?? "";
  const customerInfo = input.client
    ? customerInfoFromParty(partyFromClient(input.client))
    : undefined;

  const response = await fetch("/api/invoices/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      client_id: input.client?.id,
      title: input.title,
      tax_year: new Date().getFullYear(),
      customer_info: customerInfo,
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

export async function markInvoicePaid(
  invoiceId: string,
  input: { paidOn?: string; note?: string; method?: string } = {},
): Promise<void> {
  const response = await fetch(`/api/invoices/${invoiceId}/paid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      paid_on: input.paidOn,
      note: input.note,
      method: input.method,
    }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Failed to mark invoice paid");
  }
}

export async function cancelInvoice(invoiceId: string, reason: string): Promise<void> {
  const response = await fetch(`/api/invoices/${invoiceId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Failed to cancel invoice");
  }
}

export async function resolveOrCreateClient(input: {
  selected?: InvoiceClient | null;
  pendingName: string;
  clients: InvoiceClient[];
}): Promise<InvoiceClient | null> {
  if (input.selected) return input.selected;
  const name = input.pendingName.trim();
  if (!name) return null;
  const match = input.clients.find(
    (client) => client.legal_name.trim().toLowerCase() === name.toLowerCase(),
  );
  if (match) return match;

  const response = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ legal_name: name }),
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

export async function sendInvoiceEmail(
  invoiceId: string,
): Promise<{ sent: boolean; to?: string; error?: string }> {
  const response = await fetch(`/api/invoices/${invoiceId}/send`, {
    method: "POST",
    credentials: "include",
  });
  const body = (await response.json().catch(() => ({}))) as {
    sent?: boolean;
    to?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.error || "Failed to send invoice");
  }
  return { sent: Boolean(body.sent), to: body.to, error: body.error };
}

export async function attachInvoiceClient(
  invoiceId: string,
  clientId: string,
): Promise<void> {
  const response = await fetch(`/api/invoices/${invoiceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ client_id: clientId }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Failed to attach client");
  }
}

export { titleFromFile };
