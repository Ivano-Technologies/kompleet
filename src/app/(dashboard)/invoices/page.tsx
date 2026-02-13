'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient as createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type DbInvoice = Database['public']['Tables']['invoices']['Row'];

interface Invoice extends Omit<DbInvoice, 'customer_info'> {
  customer_info: {
    name: string;
    email?: string;
    address?: string;
  };
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, yearFilter]);

  useEffect(() => {
    // Auto-select first invoice when list changes
    if (invoices.length > 0 && !selectedInvoice) {
      setSelectedInvoice(invoices[0]);
    }
  }, [invoices]);

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      let query = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .eq('tax_year', yearFilter)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setInvoices((data || []) as Invoice[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(query) ||
      invoice.customer_info.name.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-500/10 text-gray-400',
      issued: 'bg-warning-500/10 text-warning-500',
      paid: 'bg-success-500/10 text-success-500',
      cancelled: 'bg-error-500/10 text-error-500',
      archived: 'bg-purple-500/10 text-purple-400'
    };

    const labels = {
      draft: 'DRAFT',
      issued: 'AWAITING PAYMENT',
      paid: 'PAID',
      cancelled: 'CANCELLED',
      archived: 'ARCHIVED'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-dark-background flex">
      {/* Left Sidebar - Invoice List */}
      <div className="w-96 bg-dark-surface border-r border-dark-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-dark-text-primary">Invoices</h1>
            <button
              onClick={() => router.push('/invoices/new')}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
            >
              <span className="material-icons text-sm">add</span>
              Create New Invoice
            </button>
          </div>
          <p className="text-dark-text-tertiary text-sm">
            Managing {filteredInvoices.length} active transaction{filteredInvoices.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-dark-border">
          <div className="relative">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-dark-text-tertiary text-sm">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices or clients..."
              className="w-full bg-dark-background border border-dark-border rounded-lg pl-10 pr-4 py-2 text-dark-text-primary placeholder-dark-text-tertiary focus:outline-none focus:border-primary-500 transition-colors text-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-error-500/10 border border-error-500/20 rounded-lg text-error-500 text-sm">
            {error}
          </div>
        )}

        {/* Invoice List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-dark-text-tertiary">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-3"></div>
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-dark-text-tertiary">
              <span className="material-icons text-4xl mb-3 opacity-50">description</span>
              <p className="text-sm">No invoices found</p>
              <button
                onClick={() => router.push('/invoices/new')}
                className="mt-4 text-primary-500 hover:text-primary-400 text-sm font-medium"
              >
                Create your first invoice →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-dark-border/50">
              {filteredInvoices.map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => setSelectedInvoice(invoice)}
                  className={`w-full p-4 text-left hover:bg-dark-surface-hover transition-colors ${
                    selectedInvoice?.id === invoice.id ? 'bg-dark-surface-hover border-l-4 border-primary-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
                        <span className="text-primary-500 font-bold text-sm">
                          {invoice.customer_info.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-dark-text-primary text-sm">
                          {invoice.customer_info.name}
                        </div>
                        <div className="text-dark-text-tertiary text-xs">
                          {invoice.invoice_number}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-dark-text-tertiary">
                      {new Date(invoice.invoice_date).toLocaleDateString('en-NG')}
                    </span>
                    <span className="font-bold text-dark-text-primary">
                      ₦{invoice.total_amount.toLocaleString('en-NG')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Invoice Preview */}
      <div className="flex-1 overflow-y-auto">
        {selectedInvoice ? (
          <div className="max-w-4xl mx-auto p-8">
            {/* Invoice Preview Card */}
            <div className="bg-dark-surface border border-dark-border rounded-2xl p-12">
              {/* Header */}
              <div className="flex items-start justify-between mb-12">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-primary-500 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">K</span>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-dark-text-primary">KOMPLEET</div>
                      <div className="text-dark-text-tertiary text-sm">Plot 42, Lekki Phase 1</div>
                      <div className="text-dark-text-tertiary text-sm">Lagos, Nigeria</div>
                      <div className="text-primary-500 text-sm">billing@kompleet.tax</div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-dark-text-primary mb-2">INVOICE</div>
                  <div className="text-primary-500 font-semibold text-lg">{selectedInvoice.invoice_number}</div>
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between gap-8">
                      <span className="text-dark-text-tertiary">ISSUED:</span>
                      <span className="text-dark-text-primary font-medium">
                        {new Date(selectedInvoice.invoice_date).toLocaleDateString('en-NG', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }).toUpperCase()}
                      </span>
                    </div>
                    {selectedInvoice.due_date && (
                      <div className="flex justify-between gap-8">
                        <span className="text-dark-text-tertiary">DUE:</span>
                        <span className="text-dark-text-primary font-medium">
                          {new Date(selectedInvoice.due_date).toLocaleDateString('en-NG', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="mb-12">
                <div className="text-dark-text-tertiary text-sm font-semibold mb-2">CLIENT INFORMATION</div>
                <div className="bg-dark-background border border-dark-border rounded-xl p-6">
                  <div className="text-xl font-bold text-dark-text-primary mb-1">
                    {selectedInvoice.customer_info.name}
                  </div>
                  {selectedInvoice.customer_info.address && (
                    <div className="text-dark-text-secondary text-sm mb-1">
                      {selectedInvoice.customer_info.address}
                    </div>
                  )}
                  {selectedInvoice.customer_info.email && (
                    <div className="text-dark-text-secondary text-sm">
                      {selectedInvoice.customer_info.email}
                    </div>
                  )}
                  <div className="mt-4">
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="mb-12">
                <div className="text-dark-text-tertiary text-sm font-semibold mb-4">SERVICE DETAILS</div>
                <table className="w-full">
                  <thead className="border-b border-dark-border">
                    <tr className="text-left">
                      <th className="pb-3 text-xs font-semibold text-dark-text-tertiary uppercase">QTY</th>
                      <th className="pb-3 text-xs font-semibold text-dark-text-tertiary uppercase">RATE</th>
                      <th className="pb-3 text-xs font-semibold text-dark-text-tertiary uppercase text-right">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/50">
                    {/* Sample line items - replace with actual data */}
                    <tr>
                      <td className="py-4 text-dark-text-primary">01</td>
                      <td className="py-4 text-dark-text-primary">₦{(selectedInvoice.subtotal || selectedInvoice.total_amount).toLocaleString('en-NG')}</td>
                      <td className="py-4 text-dark-text-primary text-right font-semibold">
                        ₦{(selectedInvoice.subtotal || selectedInvoice.total_amount).toLocaleString('en-NG')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-text-tertiary">SUBTOTAL</span>
                    <span className="text-dark-text-primary font-medium">
                      ₦{(selectedInvoice.subtotal || selectedInvoice.total_amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {selectedInvoice.vat_amount && selectedInvoice.vat_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-dark-text-tertiary">VAT (7.5%)</span>
                      <span className="text-dark-text-primary font-medium">
                        ₦{selectedInvoice.vat_amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-dark-border pt-3 flex justify-between">
                    <span className="text-dark-text-primary font-bold text-lg">TOTAL AMOUNT</span>
                    <span className="text-primary-500 font-bold text-2xl">
                      ₦{selectedInvoice.total_amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  onClick={() => router.push(`/invoices/${selectedInvoice.id}`)}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
                >
                  <span className="material-icons text-sm">send</span>
                  SEND TO CLIENT
                </button>
                <button
                  onClick={() => window.open(`/api/invoices/${selectedInvoice.id}/pdf`, '_blank')}
                  className="bg-dark-background hover:bg-dark-surface-hover border border-dark-border text-dark-text-primary px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
                >
                  <span className="material-icons text-sm">download</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-dark-text-tertiary">
            <div className="text-center">
              <span className="material-icons text-6xl mb-4 opacity-30">description</span>
              <p>Select an invoice to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
