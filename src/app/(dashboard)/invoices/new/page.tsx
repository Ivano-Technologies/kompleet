"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient as createClient } from "@/lib/supabase/client";
import { InvoiceLineItem, CustomerInfo } from "@/lib/invoice-service";
import { FilePlus2, Loader2, Plus, Trash2 } from "lucide-react";

type ClientOption = { id: string; legal_name: string };

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientId, setClientId] = useState("");

  // Form state
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    tin: "",
  });

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      description: "",
      quantity: 1,
      unit_price: 0,
      vat_rate: 7.5,
      discount: 0,
      amount: 0,
    },
  ]);

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error: clientsError } = await supabase
          .from("clients")
          .select("id, legal_name")
          .order("legal_name", { ascending: true });
        if (cancelled) return;
        if (clientsError) {
          setError(clientsError.message);
          return;
        }
        setClients(data ?? []);
        if (data?.length === 1 && data[0]) {
          setClientId(data[0].id);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load clients");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Calculate line item amount
  const calculateLineItemAmount = (item: InvoiceLineItem): number => {
    const baseAmount = item.quantity * item.unit_price;
    const discount = item.discount || 0;
    const subtotal = baseAmount - discount;
    const vatAmount = (subtotal * item.vat_rate) / 100;
    return Number((subtotal + vatAmount).toFixed(2));
  };

  // Update line item
  const updateLineItem = (
    index: number,
    field: keyof InvoiceLineItem,
    value: any,
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    updated[index].amount = calculateLineItemAmount(updated[index]);
    setLineItems(updated);
  };

  // Add line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: "",
        quantity: 1,
        unit_price: 0,
        vat_rate: 7.5,
        discount: 0,
        amount: 0,
      },
    ]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  // Calculate totals
  const calculateTotals = () => {
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

    return {
      subtotal: Number(subtotal.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      discountAmount: Number(discountAmount.toFixed(2)),
      total: Number((subtotal + vatAmount).toFixed(2)),
    };
  };

  const totals = calculateTotals();

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!clientId) {
      errors.push("Client is required");
    }

    if (!customerInfo.name.trim()) {
      errors.push("Customer name is required");
    }

    if (lineItems.length === 0) {
      errors.push("At least one line item is required");
    }

    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.description.trim()) {
        errors.push(`Line item ${i + 1}: Description is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Line item ${i + 1}: Quantity must be greater than 0`);
      }
      if (item.unit_price < 0) {
        errors.push(`Line item ${i + 1}: Unit price cannot be negative`);
      }
    }

    return errors;
  };

  // Save as draft
  const saveDraft = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(". "));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          client_id: clientId,
          tax_year: new Date(invoiceDate).getFullYear(),
          customer_info: customerInfo,
          line_items: lineItems,
          invoice_date: invoiceDate,
          due_date: dueDate || undefined,
          payment_terms: paymentTerms || undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to create invoice");
      }

      const { invoice_id } = await response.json();
      router.push(`/invoices/${invoice_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Issue invoice
  const issueInvoice = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(". "));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Create invoice
      const createResponse = await fetch("/api/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          client_id: clientId,
          tax_year: new Date(invoiceDate).getFullYear(),
          customer_info: customerInfo,
          line_items: lineItems,
          invoice_date: invoiceDate,
          due_date: dueDate || undefined,
          payment_terms: paymentTerms || undefined,
          notes: notes || undefined,
        }),
      });

      if (!createResponse.ok) {
        const body = await createResponse.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to create invoice");
      }

      const { invoice_id } = await createResponse.json();

      // Issue invoice (sign and make immutable)
      const issueResponse = await fetch(`/api/invoices/${invoice_id}/issue`, {
        method: "POST",
        credentials: "include",
      });

      if (!issueResponse.ok) {
        throw new Error("Failed to issue invoice");
      }

      router.push(`/invoices/${invoice_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8 flex items-center gap-4">
        <FilePlus2 className="h-8 w-8 text-light-text-secondary dark:text-dark-text-secondary" />
        <div>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Create New Invoice
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Generate NRS-compliant e-invoices with digital signatures
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-6">
        <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
          Issuing client
        </h2>
        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
          Client <span className="text-red-500">*</span>
        </label>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Select a client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.legal_name}
            </option>
          ))}
        </select>
        {clients.length === 0 && (
          <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            No clients found. Add a client before issuing an invoice.
          </p>
        )}
      </div>

      {/* Customer Information */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-6">
        <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
          Customer Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter customer name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="customer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="+234..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              TIN
            </label>
            <input
              type="text"
              value={customerInfo.tin}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, tin: e.target.value })
              }
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tax Identification Number"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Address
            </label>
            <textarea
              value={customerInfo.address}
              onChange={(e) =>
                setCustomerInfo({ ...customerInfo, address: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Full address"
            />
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-6">
        <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
          Invoice Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Invoice Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Payment Terms
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Net 30"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-6">
        <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
          Line Items
        </h2>

        <div className="space-y-4">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-4 items-start p-4 rounded-lg bg-light-background dark:bg-dark-background"
            >
              <div className="col-span-12 md:col-span-4">
                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(index, "description", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface dark:bg-dark-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Service or product"
                />
              </div>

              <div className="col-span-6 md:col-span-2 min-w-[4.5rem]">
                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                  Qty
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateLineItem(
                      index,
                      "quantity",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface dark:bg-dark-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                  Unit Price
                </label>
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) =>
                    updateLineItem(
                      index,
                      "unit_price",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface dark:bg-dark-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-6 md:col-span-2 min-w-[4.5rem]">
                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                  VAT %
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={item.vat_rate}
                  onChange={(e) =>
                    updateLineItem(
                      index,
                      "vat_rate",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface dark:bg-dark-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                  Discount
                </label>
                <input
                  type="number"
                  value={item.discount}
                  onChange={(e) =>
                    updateLineItem(
                      index,
                      "discount",
                      parseFloat(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface dark:bg-dark-surface focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-10 md:col-span-2 min-w-[6rem]">
                <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                  Amount (₦)
                </label>
                <p className="px-3 py-2 text-light-text-primary dark:text-dark-text-primary font-medium tabular-nums">
                  ₦{item.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="col-span-2 md:col-span-1 flex items-end">
                <button
                  onClick={() => removeLineItem(index)}
                  className="p-2 text-light-text-tertiary dark:text-dark-text-tertiary hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addLineItem}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Line Item
        </button>
      </div>

      {/* Notes and Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
            Notes
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Add any additional notes or terms"
          />
        </div>

        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
            Totals
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                Subtotal (₦)
              </span>
              <span className="font-medium text-light-text-primary dark:text-dark-text-primary tabular-nums">
                ₦{totals.subtotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                Discount (₦)
              </span>
              <span className="font-medium text-light-text-primary dark:text-dark-text-primary tabular-nums">
                ₦{totals.discountAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                VAT ({lineItems[0]?.vat_rate || 7.5}%)
              </span>
              <span className="font-medium text-light-text-primary dark:text-dark-text-primary tabular-nums">
                ₦{totals.vatAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-t border-light-border dark:border-dark-border my-2"></div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-light-text-primary dark:text-dark-text-primary">
                Total (₦)
              </span>
              <span className="text-primary-600 tabular-nums">
                ₦{totals.total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={saveDraft}
          disabled={loading}
          className="btn-secondary"
        >
          {loading ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            "Save as Draft"
          )}
        </button>
        <button
          onClick={issueInvoice}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <Loader2 className="animate-spin h-5 w-5" />
          ) : (
            "Issue Invoice"
          )}
        </button>
      </div>
    </div>
  );
}
