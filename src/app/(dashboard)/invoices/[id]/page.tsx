'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient as createClient } from '@/lib/supabase/client';
import Image from 'next/image';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
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
  subtotal: number;
  vat_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  tax_year: number;
  payment_terms?: string;
  notes?: string;
  signature_hash?: string;
  qr_payload?: string;
  is_immutable: boolean;
  created_at: string;
  issued_at?: string;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setInvoice(data);

      // Generate QR code image if payload exists
      if (data.qr_payload) {
        const response = await fetch('/api/invoices/qr-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: data.qr_payload })
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
  };

  const handleDownloadPDF = () => {
    window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
  };

  const handleCancelInvoice = async () => {
    if (!confirm('Are you sure you want to cancel this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/cancel`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel invoice');
      }

      // Refresh invoice data
      await fetchInvoice();
      alert('Invoice cancelled successfully');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      issued: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      archived: 'bg-purple-100 text-purple-700'
    };

    return (
      <span className={`px-4 py-2 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          {error || 'Invoice not found'}
        </div>
        <button
          onClick={() => router.push('/invoices')}
          className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
            onClick={() => router.push('/invoices')}
            className="text-green-600 hover:text-green-700 mb-4 flex items-center"
          >
            ← Back to Invoices
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_number}</h1>
          <p className="text-gray-600 mt-2">Tax Year {invoice.tax_year}</p>
        </div>
        <div className="flex items-center gap-4">
          {getStatusBadge(invoice.status)}
          {invoice.is_immutable && (
            <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Immutable
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-8">
        {invoice.status === 'issued' && (
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Download PDF
          </button>
        )}
        {invoice.status === 'draft' && (
          <button
            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Edit Invoice
          </button>
        )}
        {(invoice.status === 'issued' || invoice.status === 'draft') && (
          <button
            onClick={handleCancelInvoice}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Cancel Invoice
          </button>
        )}
      </div>

      {/* Invoice Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        {/* Customer Info */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Name</div>
              <div className="text-base font-medium text-gray-900">{invoice.customer_info.name}</div>
            </div>
            {invoice.customer_info.email && (
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div className="text-base text-gray-900">{invoice.customer_info.email}</div>
              </div>
            )}
            {invoice.customer_info.phone && (
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="text-base text-gray-900">{invoice.customer_info.phone}</div>
              </div>
            )}
            {invoice.customer_info.tin && (
              <div>
                <div className="text-sm text-gray-600">TIN</div>
                <div className="text-base text-gray-900">{invoice.customer_info.tin}</div>
              </div>
            )}
            {invoice.customer_info.address && (
              <div className="col-span-2">
                <div className="text-sm text-gray-600">Address</div>
                <div className="text-base text-gray-900">{invoice.customer_info.address}</div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Dates */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Invoice Date</div>
            <div className="text-base font-medium text-gray-900">
              {new Date(invoice.invoice_date).toLocaleDateString('en-NG', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          {invoice.due_date && (
            <div>
              <div className="text-sm text-gray-600">Due Date</div>
              <div className="text-base font-medium text-gray-900">
                {new Date(invoice.due_date).toLocaleDateString('en-NG', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          )}
          {invoice.issued_at && (
            <div>
              <div className="text-sm text-gray-600">Issued At</div>
              <div className="text-base font-medium text-gray-900">
                {new Date(invoice.issued_at).toLocaleDateString('en-NG', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Line Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">VAT</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.line_items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ₦{item.unit_price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.vat_rate}%</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      ₦{item.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-medium">₦{invoice.subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>VAT (7.5%):</span>
                <span className="font-medium">₦{invoice.vat_amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Discount:</span>
                  <span className="font-medium">-₦{invoice.discount_amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-gray-900 pt-3 border-t border-gray-300">
                <span>Total:</span>
                <span>₦{invoice.total_amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {(invoice.payment_terms || invoice.notes) && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            {invoice.payment_terms && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Payment Terms</div>
                <div className="text-sm text-gray-900">{invoice.payment_terms}</div>
              </div>
            )}
            {invoice.notes && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Notes</div>
                <div className="text-sm text-gray-900">{invoice.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Digital Signature & QR Code */}
      {invoice.signature_hash && (
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Security & Verification</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Digital Signature */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Digital Signature
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-600 mb-1">Signature Hash (SHA-256)</div>
                <div className="text-xs font-mono text-gray-900 break-all">
                  {invoice.signature_hash.substring(0, 64)}...
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified & Immutable
                </div>
              </div>
            </div>

            {/* QR Code */}
            {qrCodeImage && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">NRS-Compliant QR Code</h3>
                <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
                  <img src={qrCodeImage} alt="Invoice QR Code" className="w-48 h-48" />
                  <div className="mt-3 text-xs text-gray-600 text-center">
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
