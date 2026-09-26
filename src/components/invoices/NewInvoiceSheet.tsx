"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { INV_COPY } from "./invoice-copy";
import {
  CustomerCombobox,
  type InvoiceClient,
} from "./CustomerCombobox";
import { InvoiceDropZone } from "./InvoiceDropZone";
import {
  clientNameFromFile,
  createInvoiceDraft,
  ensureClientFromName,
  issueInvoice,
} from "./invoice-actions";

export function NewInvoiceSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (invoiceId: string) => void;
}) {
  const router = useRouter();
  const [clients, setClients] = useState<InvoiceClient[]>([]);
  const [customer, setCustomer] = useState<InvoiceClient | null>(null);
  const [amount, setAmount] = useState("");
  const [addVat, setAddVat] = useState(true);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/clients", { credentials: "include" });
        if (!response.ok || cancelled) return;
        const body = (await response.json()) as { clients?: InvoiceClient[] };
        if (!cancelled) setClients(body.clients ?? []);
      } catch {
        /* list can stay empty; inline create still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const reset = () => {
    setCustomer(null);
    setAmount("");
    setAddVat(true);
    setDescription("");
    setError(null);
    setNotice(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const validateQuick = (): string | null => {
    if (!customer) return "Customer is required";
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return "Amount must be greater than 0";
    return null;
  };

  const saveDraft = async () => {
    const problem = validateQuick();
    if (problem) {
      setError(problem);
      return;
    }
    if (!customer) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createInvoiceDraft({
        client: customer,
        amount: Number(amount),
        addVat,
        description,
      });
      onCreated?.(created.invoice_id);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setBusy(false);
    }
  };

  const issue = async () => {
    const problem = validateQuick();
    if (problem) {
      setError(problem);
      return;
    }
    if (!customer) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createInvoiceDraft({
        client: customer,
        amount: Number(amount),
        addVat,
        description,
      });
      await issueInvoice(created.invoice_id);
      onCreated?.(created.invoice_id);
      close();
      router.push(`/invoices/${created.invoice_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue invoice");
    } finally {
      setBusy(false);
    }
  };

  const dropToDraft = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const client =
        customer ?? (await ensureClientFromName(clientNameFromFile(file.name)));
      if (!customer) setCustomer(client);
      const created = await createInvoiceDraft({
        client,
        amount: 0,
        addVat: true,
        description: "Services",
        notes: `Attached: ${file.name}`,
      });
      setNotice(INV_COPY.dropToast);
      onCreated?.(created.invoice_id);
      close();
      router.push(`/invoices/${created.invoice_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create draft");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={close}
      />
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-text-1">{INV_COPY.sheetTitle}</h2>
            <p className="text-sm text-text-2 mt-1">{INV_COPY.sheetHow}</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-text-3 hover:text-text-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <section>
            <p className="text-xs font-bold uppercase tracking-widest text-text-3 mb-2">
              A · Drop
            </p>
            <InvoiceDropZone onFile={dropToDraft} disabled={busy} />
          </section>

          <section className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-text-3">
              B · Quick create
            </p>
            <label className="block text-sm">
              <span className="text-text-2">
                {INV_COPY.quickCustomer} <span className="text-error">*</span>
              </span>
              <div className="mt-1">
                <CustomerCombobox
                  clients={clients}
                  value={customer}
                  onChange={setCustomer}
                  onCreated={(created) => setClients((prev) => [created, ...prev])}
                />
              </div>
            </label>
            <label className="block text-sm">
              <span className="text-text-2">
                {INV_COPY.quickAmount} <span className="text-error">*</span>
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-text-1">
              <input
                type="checkbox"
                checked={addVat}
                onChange={(event) => setAddVat(event.target.checked)}
                className="rounded border-border"
              />
              {INV_COPY.quickVat}
            </label>
            <label className="block text-sm">
              <span className="text-text-2">{INV_COPY.quickDesc}</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={INV_COPY.quickDescPlaceholder}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            {error && <p className="text-sm text-error">{error}</p>}
            {notice && <p className="text-sm text-success">{notice}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary text-sm px-3 py-2"
                disabled={busy}
                onClick={() => void saveDraft()}
              >
                {INV_COPY.quickSaveDraft}
              </button>
              <button
                type="button"
                className="btn-primary text-sm px-3 py-2"
                disabled={busy}
                onClick={() => void issue()}
              >
                {INV_COPY.quickIssue}
              </button>
            </div>
          </section>

          <p className="text-sm text-text-3">
            C ·{" "}
            <button
              type="button"
              className="font-medium text-primary"
              onClick={() => {
                close();
                router.push("/invoices/new");
              }}
            >
              {INV_COPY.fullLink}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
