"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createBrowserClient as createClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
  Loader2,
  ArrowLeft,
  Download,
  Edit,
  XCircle,
  Lock,
  ShieldCheck,
} from "lucide-react";

import type { Database } from "@/lib/supabase/types";

type DbInvoice = Database["public"]["Tables"]["invoices"]["Row"];

interface Invoice extends Omit<DbInvoice, "customer_info" | "line_items"> {
  customer_info: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    tin?: string;
  };
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
    discount?: number;
    amount: number;
  }>;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState("");

  const fetchInvoice = useCallback(async () => {
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

      const { data, error: fetchError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (fetchError) throw fetchError;

      setInvoice(data as Invoice);

      if (data.qr_payload) {
        const response = await fetch("/api/invoices/qr-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: data.qr_payload }),
        });

        if (response.ok) {
          const { qrCodeDataUrl } = await response.json();
          setQrCodeImage(qrCodeDataUrl);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleDownloadPDF = () => {
    window.open(`/api/invoices/${invoiceId}/pdf`, "_blank");
  };

  const handleCancelInvoice = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this invoice? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel invoice");
      }

      await fetchInvoice();
      alert("Invoice cancelled successfully");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
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
        className={`px-4 py-2 rounded-full text-sm font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
          Back to Invoices
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
            Back to Invoices
          </button>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            {invoice.invoice_number}
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Tax Year {invoice.tax_year}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {getStatusBadge(invoice.status)}
          {invoice.is_immutable && (
            <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium flex items-center gap-2">
              <Lock size={16} />
              Immutable
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        {invoice.status === "issued" && (
          <button onClick={handleDownloadPDF} className="btn-primary">
            <Download size={16} />
            Download PDF
          </button>
        )}
        {invoice.status === "draft" && (
          <button
            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
            className="btn-secondary"
          >
            <Edit size={16} />
            Edit Invoice
          </button>
        )}
        {(invoice.status === "issued" || invoice.status === "draft") && (
          <button onClick={handleCancelInvoice} className="btn-danger">
            <XCircle size={16} />
            Cancel Invoice
          </button>
        )}
      </div>

      {/* Invoice Details */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-6">
        {/* Customer Info */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Customer Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Name
              </div>
              <div className="text-base font-medium text-light-text-primary dark:text-dark-text-primary">
                {invoice.customer_info.name}
              </div>
            </div>
            {invoice.customer_info.email && (
              <div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Email
                </div>
                <div className="text-base text-light-text-primary dark:text-dark-text-primary">
                  {invoice.customer_info.email}
                </div>
              </div>
            )}
            {invoice.customer_info.phone && (
              <div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Phone
                </div>
                <div className="text-base text-light-text-primary dark:text-dark-text-primary">
                  {invoice.customer_info.phone}
                </div>
              </div>
            )}
            {invoice.customer_info.tin && (
              <div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  TIN
                </div>
                <div className="text-base text-light-text-primary dark:text-dark-text-primary">
                  {invoice.customer_info.tin}
                </div>
              </div>
            )}
            {invoice.customer_info.address && (
              <div className="col-span-2">
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Address
                </div>
                <div className="text-base text-light-text-primary dark:text-dark-text-primary">
                  {invoice.customer_info.address}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Dates */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Invoice Date
            </div>
            <div className="text-base font-medium text-light-text-primary dark:text-dark-text-primary">
              {new Date(invoice.invoice_date).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
          {invoice.due_date && (
            <div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Due Date
              </div>
              <div className="text-base font-medium text-light-text-primary dark:text-dark-text-primary">
                {new Date(invoice.due_date).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          )}
          {invoice.issued_at && (
            <div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Issued At
              </div>
              <div className="text-base font-medium text-light-text-primary dark:text-dark-text-primary">
                {new Date(invoice.issued_at).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Line Items
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-light-background dark:bg-dark-background border-b border-light-border dark:border-dark-border">
                <tr>
                  <th className="w-[35%] px-4 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    Description
                  </th>
                  <th className="w-[10%] min-w-[4rem] px-4 py-3 text-right text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    Qty
                  </th>
                  <th className="w-[20%] min-w-[6rem] px-4 py-3 text-right text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    Unit Price (₦)
                  </th>
                  <th className="w-[10%] min-w-[4rem] px-4 py-3 text-right text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    VAT
                  </th>
                  <th className="w-[25%] min-w-[7rem] px-4 py-3 text-right text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    Amount (₦)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {invoice.line_items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-light-text-primary dark:text-dark-text-primary break-words">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-light-text-primary dark:text-dark-text-primary text-right tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-light-text-primary dark:text-dark-text-primary text-right tabular-nums whitespace-nowrap">
                      ₦{item.unit_price.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-light-text-primary dark:text-dark-text-primary text-right tabular-nums">
                      {item.vat_rate}%
                    </td>
                    <td className="px-4 py-3 text-sm text-light-text-primary dark:text-dark-text-primary text-right tabular-nums whitespace-nowrap">
                      ₦{item.amount.toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-light-border dark:border-dark-border pt-6">
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-3">
              <div className="flex justify-between text-light-text-secondary dark:text-dark-text-secondary">
                <span>Subtotal:</span>
                <span className="font-medium">
                  ₦
                  {invoice.subtotal.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-light-text-secondary dark:text-dark-text-secondary">
                <span>VAT (7.5%):</span>
                <span className="font-medium">
                  ₦
                  {invoice.vat_amount.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-light-text-secondary dark:text-dark-text-secondary">
                  <span>Discount:</span>
                  <span className="font-medium">
                    -₦
                    {invoice.discount_amount.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-light-text-primary dark:text-dark-text-primary pt-3 border-t border-light-border dark:border-dark-border">
                <span>Total:</span>
                <span>
                  ₦
                  {invoice.total_amount.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

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

      {/* Digital Signature & QR Code */}
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

            {/* QR Code */}
            {qrCodeImage && (
              <div>
                <h3 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-3">
                  NRS-Compliant QR Code
                </h3>
                <div className="bg-light-background dark:bg-dark-background rounded-lg p-4 flex flex-col items-center">
                  <img
                    src={qrCodeImage}
                    alt="Invoice QR Code"
                    className="w-48 h-48"
                  />
                  <div className="mt-3 text-xs text-light-text-tertiary dark:text-dark-text-tertiary text-center">
                    Scan to verify invoice authenticity
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
