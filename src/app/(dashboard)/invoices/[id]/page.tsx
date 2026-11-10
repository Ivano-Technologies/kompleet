"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Download,
  Edit,
  Send,
  XCircle,
  Lock,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

import type { InvoiceView } from "@/lib/invoices/view-types";
import { AttachFileButton } from "@/components/documents/AttachFileButton";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { INV_COPY, INV_STATUS_LABEL } from "@/components/invoices/invoice-copy";
import { CancelInvoiceDialog, MarkPaidDialog } from "@/components/invoices/InvoiceStatusDialogs";
import { BIZ_COPY } from "@/components/settings/profile-copy";
import {
  attachInvoiceClient,
  cancelInvoice,
  issueInvoice,
  markInvoicePaid,
  sendInvoiceEmail,
} from "@/components/invoices/invoice-actions";
import { invoiceRecipientEmail } from "@/lib/invoices/invoice-email";
import type { InvoiceClient } from "@/components/invoices/CustomerCombobox";
import {
  hasLegalName,
  type BusinessProfile,
} from "@/lib/invoices/profiles";
import { onBusinessProfileChanged } from "@/lib/invoices/profile-events";
import { toFriendlyMessage, userFacingError } from "@/lib/friendly-error";
import { notifyError } from "@/components/ui/error-toast";

type Invoice = InvoiceView;

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [clients, setClients] = useState<InvoiceClient[]>([]);
  const [issuing, setIssuing] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [paidOpen, setPaidOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState("");

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw userFacingError(body, "We couldn't find this invoice.");
      }
      const payload = (await response.json()) as { invoice: Invoice };
      const data = payload.invoice;
      setInvoice(data);

    } catch (err: unknown) {
      setError(toFriendlyMessage(err, "We couldn't load this invoice. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("issued") === "1") setNotice(INV_COPY.issueToast);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
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
        /* optional */
      }
    };
    void load();
    const stop = onBusinessProfileChanged(() => {
      void load();
      void fetchInvoice();
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [fetchInvoice]);

  const handleDownloadPDF = () => {
    window.open(`/api/invoices/${invoiceId}/pdf`, "_blank");
  };

  const handleMarkPaid = async (input: { paidOn: string; note: string }) => {
    setStatusBusy(true);
    setStatusError("");
    try {
      await markInvoicePaid(invoiceId, {
        paidOn: input.paidOn,
        note: input.note.trim() || undefined,
      });
      setPaidOpen(false);
      await fetchInvoice();
    } catch (err: unknown) {
      const message = toFriendlyMessage(
        err,
        "We couldn't mark this invoice as paid. Please try again.",
      );
      setStatusError(message);
      notifyError(message);
    } finally {
      setStatusBusy(false);
    }
  };

  const handleCancelInvoice = async (reason: string) => {
    setStatusBusy(true);
    setStatusError("");
    try {
      await cancelInvoice(invoiceId, reason);
      setCancelOpen(false);
      await fetchInvoice();
    } catch (err: unknown) {
      const message = toFriendlyMessage(
        err,
        "We couldn't cancel this invoice. Please try again.",
      );
      setStatusError(message);
      notifyError(message);
    } finally {
      setStatusBusy(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      draft:
        "bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary dark:bg-dark-surface dark:text-light-text-tertiary dark:text-dark-text-tertiary",
      issued:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
      paid: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
      archived:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
    };

    return (
      <span
        className={`px-4 py-2 rounded-full text-sm font-medium ${styles[status] ?? styles.draft}`}
      >
        {INV_STATUS_LABEL[status] ?? status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg p-6 text-red-700 dark:text-red-300">
          {error || "Invoice not found"}
        </div>
        <button
          onClick={() => router.push("/invoices")}
          className="mt-4 btn-secondary"
        >
          Back to invoices
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <button
            onClick={() => router.push("/invoices")}
            className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-500 mb-4 flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to invoices
          </button>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {invoice.invoice_number}
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Tax year {invoice.tax_year}
          </p>
          {invoice.status === "paid" && invoice.paid_on ? (
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
              {INV_COPY.paidOnPrefix} {invoice.paid_on}
            </p>
          ) : null}
          {invoice.status === "cancelled" && invoice.cancel_reason ? (
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
              {INV_COPY.cancelledPrefix}: {invoice.cancel_reason}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          {getStatusBadge(invoice.status)}
          {invoice.status === "draft" && (
            <button
              type="button"
              className="btn-primary disabled:opacity-45"
              disabled={
                issuing ||
                !invoice.client_id ||
                !hasLegalName(profile ?? { legalName: "" })
              }
              title={
                !invoice.client_id
                  ? INV_COPY.billtoRequired
                  : !hasLegalName(profile ?? { legalName: "" })
                    ? BIZ_COPY.blockLegalName
                    : undefined
              }
              onClick={async () => {
                setIssuing(true);
                try {
                  await issueInvoice(invoice.id);
                  setNotice(INV_COPY.issueToast);
                  await fetchInvoice();
                } catch (err) {
                  notifyError(toFriendlyMessage(err, "We couldn't issue this invoice. Please try again."));
                } finally {
                  setIssuing(false);
                }
              }}
            >
              Issue
            </button>
          )}
          {(invoice.status === "issued" || invoice.status === "paid") && (
            <button
              type="button"
              className="btn-primary disabled:opacity-45"
              disabled={
                sending || !invoiceRecipientEmail(invoice.customer_info)
              }
              title={
                invoiceRecipientEmail(invoice.customer_info)
                  ? undefined
                  : INV_COPY.emailNeedsAddress
              }
              onClick={async () => {
                setSending(true);
                try {
                  const result = await sendInvoiceEmail(invoice.id);
                  if (result.sent && result.to) {
                    setNotice(INV_COPY.emailSent(result.to));
                  } else {
                    notifyError(result.error || INV_COPY.emailNotSent);
                  }
                } catch (err) {
                  notifyError(
                    toFriendlyMessage(err, INV_COPY.emailNotSent),
                  );
                } finally {
                  setSending(false);
                }
              }}
            >
              <Send size={16} />
              {sending ? "Sending…" : INV_COPY.sendInvoice}
            </button>
          )}
          {invoice.is_immutable && (
            <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium flex items-center gap-2">
              <Lock size={16} />
              Immutable
            </span>
          )}
        </div>
      </div>

      {notice ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {notice}
        </p>
      ) : null}

      {/* Actions */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <AttachFileButton
          link={{
            type: "invoice",
            id: invoice.id,
            label: invoice.invoice_number,
          }}
        />
        {(invoice.status === "issued" ||
          invoice.status === "paid" ||
          invoice.status === "cancelled" ||
          invoice.status === "draft") && (
          <button
            onClick={handleDownloadPDF}
            className="btn-primary disabled:opacity-45"
            disabled={!hasLegalName(profile ?? { legalName: "" })}
            title={
              !hasLegalName(profile ?? { legalName: "" })
                ? BIZ_COPY.blockLegalName
                : undefined
            }
          >
            <Download size={16} />
            Download PDF
          </button>
        )}
        {invoice.status === "draft" && (
          <button
            onClick={() => router.push(`/invoices/${invoice.id}`)}
            className="btn-secondary"
          >
            <Edit size={16} />
            Edit invoice
          </button>
        )}
        {invoice.status === "issued" && (
          <button
            type="button"
            onClick={() => {
              setStatusError("");
              setPaidOpen(true);
            }}
            className="btn-secondary"
          >
            <CheckCircle size={16} />
            {INV_COPY.markPaid}
          </button>
        )}
        {invoice.status === "issued" && (
          <button
            type="button"
            onClick={() => {
              setStatusError("");
              setCancelOpen(true);
            }}
            className="btn-secondary text-error bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40"
          >
            <XCircle size={16} />
            {INV_COPY.cancelInvoice}
          </button>
        )}
      </div>

      {/* Invoice Details */}
      {invoice.title && (
        <p className="text-sm text-text-3 mb-4">
          Title: <strong className="text-text-2 font-semibold">{invoice.title}</strong>
        </p>
      )}

      <div className="mb-6">
        <InvoicePreview
          invoice={invoice}
          profile={profile}
          clients={clients}
          selectedClient={
            clients.find((client) => client.id === invoice.client_id) ?? null
          }
          onSelectClient={(client) => {
            if (!client) return;
            void attachInvoiceClient(invoice.id, client.id).then(() => {
              setInvoice({
                ...invoice,
                client_id: client.id,
                customer_info: {
                  name: client.legal_name,
                  email: client.email,
                  phone: client.phone,
                  addressLine1: client.addressLine1,
                  city: client.city,
                },
              });
            });
          }}
          onClientCreated={(created) => setClients((prev) => [created, ...prev])}
          onOpenSettings={() => router.push(`/invoices/${invoice.id}?settings=business`)}
          editable={invoice.status === "draft"}
        />
      </div>

      {/* Line Items and totals render inside InvoicePreview (IVA-185, black and white) */}
      <div className="mb-6">
        {/* Additional Info */}
        {(invoice.payment_terms || invoice.notes) && (
          <div className="mt-8 pt-6 border-t border-light-border dark:border-dark-border">
            {invoice.payment_terms && (
              <div className="mb-4">
                <div className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                  Payment Terms
                </div>
                <div className="text-sm text-light-text-primary dark:text-dark-text-primary">
                  {invoice.payment_terms}
                </div>
              </div>
            )}
            {invoice.notes && (
              <div>
                <div className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                  Notes
                </div>
                <div className="text-sm text-light-text-primary dark:text-dark-text-primary">
                  {invoice.notes}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Digital Signature. The QR block is hidden: there is no NRS integration and issueMine creates no IRN (IVA-185). */}
      {invoice.signature_hash && (
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">
            Security & Verification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Digital Signature */}
            <div>
              <h3 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary-500" />
                Digital Signature
              </h3>
              <div className="bg-light-background dark:bg-dark-background rounded-lg p-4">
                <div className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">
                  Signature Hash (SHA-256)
                </div>
                <div className="text-xs font-mono text-light-text-primary dark:text-dark-text-primary break-all">
                  {invoice.signature_hash.substring(0, 64)}...
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-primary-500">
                  <ShieldCheck size={16} />
                  Verified & Immutable
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {paidOpen && (
        <MarkPaidDialog
          error={statusError}
          busy={statusBusy}
          onClose={() => setPaidOpen(false)}
          onConfirm={(input) => void handleMarkPaid(input)}
        />
      )}
      {cancelOpen && (
        <CancelInvoiceDialog
          error={statusError}
          busy={statusBusy}
          onClose={() => setCancelOpen(false)}
          onConfirm={(reason) => void handleCancelInvoice(reason)}
        />
      )}
    </div>
  );
}
