"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { InvoiceView } from "@/lib/invoices/view-types";
import {
  Plus,
  Search,
  FileText,
  Send,
  Download,
} from "lucide-react";
import { NewInvoiceSheet } from "@/components/invoices/NewInvoiceSheet";
import { InvoiceDropZone } from "@/components/invoices/InvoiceDropZone";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { INV_COPY } from "@/components/invoices/invoice-copy";
import { BIZ_COPY } from "@/components/settings/profile-copy";
import {
  attachInvoiceClient,
  createInvoiceDraft,
  titleFromFile,
} from "@/components/invoices/invoice-actions";
import type { InvoiceClient } from "@/components/invoices/CustomerCombobox";
import { useLibraryUpload } from "@/components/documents/use-library-upload";
import {
  hasLegalName,
  type BusinessProfile,
} from "@/lib/invoices/profiles";

type Invoice = InvoiceView;

export default function InvoicesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-text-3 p-6">Loading invoices…</p>}>
      <InvoicesPageInner />
    </Suspense>
  );
}

function InvoicesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter] = useState<number>(new Date().getFullYear());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dropNotice, setDropNotice] = useState<string | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [clients, setClients] = useState<InvoiceClient[]>([]);
  const { upload } = useLibraryUpload();

  const openBusinessSettings = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("settings", "business");
    router.push(`/invoices?${params.toString()}`);
  };

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ taxYear: String(yearFilter) });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(`/api/invoices?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to load invoices");
      }
      const body = (await response.json()) as { invoices?: Invoice[] };
      setInvoices((body.invoices || []) as Invoice[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, yearFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [profileRes, clientsRes] = await Promise.all([
          fetch("/api/business-profile", { credentials: "include" }),
          fetch("/api/clients", { credentials: "include" }),
        ]);
        if (cancelled) return;
        if (profileRes.ok) {
          const body = (await profileRes.json()) as { profile?: BusinessProfile };
          setProfile(body.profile ?? null);
        }
        if (clientsRes.ok) {
          const body = (await clientsRes.json()) as { clients?: InvoiceClient[] };
          setClients(body.clients ?? []);
        }
      } catch {
        /* preview still works with empty profile */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") setSheetOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (invoices.length > 0 && !selectedInvoice) {
      setSelectedInvoice(invoices[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices]);

  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(q) ||
      (invoice.title ?? "").toLowerCase().includes(q) ||
      (invoice.customer_info?.name ?? "").toLowerCase().includes(q)
    );
  });

  const statusStyles: Record<string, string> = {
    draft:
      "bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary dark:bg-dark-surface/40 dark:text-light-text-tertiary dark:text-dark-text-tertiary",
    issued:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    archived:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  const statusLabels: Record<string, string> = {
    draft: "Draft",
    issued: "Awaiting Payment",
    paid: "Paid",
    cancelled: "Cancelled",
    archived: "Archived",
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        statusStyles[status] || statusStyles.draft
      }`}
    >
      {statusLabels[status] || status}
    </span>
  );

  const handleEmptyDrop = async (file: File) => {
    const created = await createInvoiceDraft({
      amount: 0,
      addVat: true,
      description: "Services",
      notes: `Attached: ${file.name}`,
      title: titleFromFile(file.name),
    });
    await upload(file, {
      source: "invoice_drop",
      linkType: "invoice",
      linkId: created.invoice_id,
    }).catch(() => undefined);
    setDropNotice(INV_COPY.dropToast);
    await fetchInvoices();
    router.push(`/invoices/${created.invoice_id}`);
  };

  const showEqualEmpty =
    !loading &&
    invoices.length === 0 &&
    statusFilter === "all" &&
    !searchQuery;

  if (showEqualEmpty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-text-1">{INV_COPY.title}</h1>
        </div>
        <p className="text-sm text-text-2">{INV_COPY.emptyTitle}</p>
        {dropNotice && <p className="text-sm text-success">{dropNotice}</p>}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-text-1 mb-3">
              {INV_COPY.emptyDropTitle}
            </h2>
            <InvoiceDropZone compact onFile={handleEmptyDrop} />
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 flex flex-col justify-between min-h-[180px]">
            <div>
              <h2 className="text-sm font-semibold text-text-1">
                {INV_COPY.emptyCreateTitle}
              </h2>
              <p className="text-xs text-text-3 mt-1">{INV_COPY.sheetHow}</p>
            </div>
            <button
              type="button"
              className="btn-primary text-sm px-3 py-2 self-start"
              onClick={() => setSheetOpen(true)}
            >
              {INV_COPY.emptyCreateCta}
            </button>
          </div>
        </div>
        <NewInvoiceSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onCreated={() => void fetchInvoices()}
        />
      </div>
    );
  }

  return (
    <div
      className="flex -m-4 lg:-m-6"
      style={{ minHeight: "calc(100vh - 3.5rem)" }}
    >
      {/* Left Sidebar - Invoice List */}
      <div className="w-80 lg:w-96 bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-5 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-display text-xl text-text-1">
              {INV_COPY.title}
            </h1>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="btn-primary text-sm px-3 py-2 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> {INV_COPY.ctaNew}
            </button>
          </div>
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
            {filteredInvoices.length} invoice
            {filteredInvoices.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search + Filter */}
        <div className="p-3 border-b border-light-border dark:border-dark-border space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-light-text-tertiary dark:text-dark-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["all", "draft", "issued", "paid", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-primary-500 text-white"
                    : "bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover"
                }`}
              >
                {s === "all" ? "All" : statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-3 mt-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Invoice List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                Loading invoices...
              </p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-4 text-sm text-text-3">
              {searchQuery || statusFilter !== "all"
                ? "No invoices match these filters."
                : INV_COPY.emptyTitle}
            </div>
          ) : (
            <div className="divide-y divide-light-border/50 dark:divide-dark-border/50">
              {filteredInvoices.map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => setSelectedInvoice(invoice)}
                  className={`w-full p-4 text-left hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors ${
                    selectedInvoice?.id === invoice.id
                      ? "bg-primary-500/5 dark:bg-primary-500/10 border-l-2 border-primary-500"
                      : "border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-500 font-bold text-xs">
                          {(invoice.customer_info?.name || invoice.title || "IN")
                            .substring(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-light-text-primary dark:text-dark-text-primary truncate">
                          {invoice.customer_info?.name || invoice.title || invoice.invoice_number}
                        </div>
                        <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                          {invoice.invoice_number}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2 pl-10">
                    <span className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                      {new Date(invoice.invoice_date).toLocaleDateString(
                        "en-NG",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                    <span className="font-semibold text-sm text-light-text-primary dark:text-dark-text-primary">
                      ₦{invoice.total_amount.toLocaleString("en-NG")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Invoice Preview */}
      <div className="flex-1 overflow-y-auto bg-light-background dark:bg-dark-background">
        {selectedInvoice ? (
          <div className="max-w-3xl mx-auto p-6 lg:p-8">
            {/* Action Bar */}
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <button
                  type="button"
                  onClick={() => router.push(`/invoices/${selectedInvoice.id}`)}
                  className="text-left"
                >
                  <h2 className="text-lg font-bold text-text-1 hover:text-primary">
                    {selectedInvoice.invoice_number}
                  </h2>
                </button>
                <p className="text-xs text-text-3 mt-0.5">
                  Title:{" "}
                  <strong className="text-text-2 font-semibold">
                    {selectedInvoice.title ||
                      selectedInvoice.customer_info?.name ||
                      "Untitled draft"}
                  </strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedInvoice.status} />
                <button
                  onClick={() => router.push(`/invoices/${selectedInvoice.id}`)}
                  className="btn-primary text-sm px-3 py-2 flex items-center gap-1.5 disabled:opacity-45"
                  disabled={
                    !selectedInvoice.client_id || !hasLegalName(profile ?? { legalName: "" })
                  }
                  title={
                    !selectedInvoice.client_id
                      ? INV_COPY.billtoRequired
                      : !hasLegalName(profile ?? { legalName: "" })
                        ? BIZ_COPY.blockLegalName
                        : undefined
                  }
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `/api/invoices/${selectedInvoice.id}/pdf`,
                      "_blank",
                    )
                  }
                  className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5 disabled:opacity-45"
                  disabled={!hasLegalName(profile ?? { legalName: "" })}
                  title={
                    !hasLegalName(profile ?? { legalName: "" })
                      ? BIZ_COPY.blockLegalName
                      : undefined
                  }
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            </div>

            <InvoicePreview
              invoice={selectedInvoice}
              profile={profile}
              clients={clients}
              selectedClient={
                clients.find((client) => client.id === selectedInvoice.client_id) ??
                null
              }
              onSelectClient={(client) => {
                if (!client) return;
                void attachInvoiceClient(selectedInvoice.id, client.id).then(() => {
                  setSelectedInvoice({
                    ...selectedInvoice,
                    client_id: client.id,
                    customer_info: {
                      name: client.legal_name,
                      email: client.email,
                      phone: client.phone,
                      addressLine1: client.addressLine1,
                      city: client.city,
                    },
                  });
                  void fetchInvoices();
                });
              }}
              onClientCreated={(created) => setClients((prev) => [created, ...prev])}
              onOpenSettings={openBusinessSettings}
              editable={selectedInvoice.status === "draft"}
            />

            <div className="bg-surface border border-border rounded-xl p-8 lg:p-10 mt-4">
              {/* Line Items */}
              <div className="mb-8">
                <p className="text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary mb-3 uppercase tracking-wide">
                  Service Details
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-light-border dark:border-dark-border">
                      <th className="pb-2 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary">
                        Qty
                      </th>
                      <th className="pb-2 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary">
                        Rate
                      </th>
                      <th className="pb-2 text-right text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-light-border/50 dark:border-dark-border/50">
                      <td className="py-3 text-light-text-primary dark:text-dark-text-primary">
                        01
                      </td>
                      <td className="py-3 text-light-text-primary dark:text-dark-text-primary">
                        ₦
                        {(
                          selectedInvoice.subtotal ||
                          selectedInvoice.total_amount
                        ).toLocaleString("en-NG")}
                      </td>
                      <td className="py-3 text-right font-medium text-light-text-primary dark:text-dark-text-primary">
                        ₦
                        {(
                          selectedInvoice.subtotal ||
                          selectedInvoice.total_amount
                        ).toLocaleString("en-NG")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-light-text-tertiary dark:text-dark-text-tertiary">
                      Subtotal
                    </span>
                    <span className="text-light-text-primary dark:text-dark-text-primary font-medium">
                      ₦
                      {(
                        selectedInvoice.subtotal || selectedInvoice.total_amount
                      ).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {selectedInvoice.vat_amount &&
                    selectedInvoice.vat_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-light-text-tertiary dark:text-dark-text-tertiary">
                          VAT (7.5%)
                        </span>
                        <span className="text-light-text-primary dark:text-dark-text-primary font-medium">
                          ₦
                          {selectedInvoice.vat_amount.toLocaleString("en-NG", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  <div className="border-t border-light-border dark:border-dark-border pt-2 flex justify-between">
                    <span className="font-bold text-light-text-primary dark:text-dark-text-primary">
                      Total
                    </span>
                    <span className="text-primary-500 font-bold text-xl">
                      ₦
                      {selectedInvoice.total_amount.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-light-text-tertiary dark:text-dark-text-tertiary opacity-30" />
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Select an invoice to preview
              </p>
            </div>
          </div>
        )}
      </div>
      <NewInvoiceSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={() => void fetchInvoices()}
      />
    </div>
  );
}
