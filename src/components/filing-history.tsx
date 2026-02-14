'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, CheckCircle, Filter } from 'lucide-react';

interface FilingRecord {
  id: string;
  form_type: string;
  tax_year: number;
  status: string;
  created_at: string;
  pdf_url: string;
  filing_status?: {
    status: string;
    filed_date: string;
    confirmation_number: string;
  }[];
}

export default function FilingHistory() {
  const [filings, setFilings] = useState<FilingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchFilingHistory();
  }, [filterYear, filterType]);

  const fetchFilingHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterYear !== 'all') params.append('taxYear', filterYear.toString());
      if (filterType !== 'all') params.append('formType', filterType);

      const response = await fetch(`/api/forms/list?${params}`);
      const data = await response.json();

      if (data.success) {
        setFilings(data.forms);
      }
    } catch (error) {
      console.error('Error fetching filing history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (filing: FilingRecord) => {
    const link = document.createElement('a');
    link.href = filing.pdf_url;
    link.download = `NRS_${filing.form_type}_${filing.tax_year}_${filing.id.slice(0, 8)}.pdf`;
    link.click();
  };

  const getFormTypeName = (formType: string) => {
    const names: Record<string, string> = {
      PIT: 'Personal Income Tax',
      CIT: 'Company Income Tax',
      VAT: 'Value Added Tax',
    };
    return names[formType] || formType;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; label: string }> = {
      draft: {
        color:
          'bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary',
        label: 'Draft',
      },
      generated: {
        color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
        label: 'Generated',
      },
      filed: {
        color: 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400',
        label: 'Filed',
      },
      archived: {
        color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
        label: 'Archived',
      },
    };

    const badge = badges[status] || badges.draft;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}
      >
        {status === 'filed' && <CheckCircle className="w-3 h-3" />}
        {badge.label}
      </span>
    );
  };

  const exportHistory = () => {
    const headers = [
      'Form Type',
      'Tax Year',
      'Status',
      'Generated Date',
      'Filed Date',
      'Confirmation Number',
    ];

    const rows = filings.map(f => [
      getFormTypeName(f.form_type),
      f.tax_year,
      f.status,
      new Date(f.created_at).toLocaleDateString('en-NG'),
      f.filing_status?.[0]?.filed_date
        ? new Date(f.filing_status[0].filed_date).toLocaleDateString('en-NG')
        : 'N/A',
      f.filing_status?.[0]?.confirmation_number || 'N/A',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `filing-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="bg-light-surface dark:bg-dark-surface rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
              Filing History
            </h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
              {filings.length} {filings.length === 1 ? 'filing' : 'filings'} found
            </p>
          </div>

          <button
            onClick={exportHistory}
            disabled={filings.length === 0}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-light-text-secondary dark:text-dark-text-secondary" />
            <select
              value={filterYear}
              onChange={e =>
                setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
              }
              className="px-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-light-surface dark:bg-dark-surface"
            >
              <option value="all">All Years</option>
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-light-surface dark:bg-dark-surface"
          >
            <option value="all">All Form Types</option>
            <option value="PIT">Personal Income Tax (PIT)</option>
            <option value="CIT">Company Income Tax (CIT)</option>
            <option value="VAT">Value Added Tax (VAT)</option>
          </select>
        </div>
      </div>

      {/* Filing List */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          <p className="mt-4 text-light-text-secondary dark:text-dark-text-secondary">
            Loading filing history...
          </p>
        </div>
      ) : filings.length === 0 ? (
        <div className="p-12 text-center">
          <FileText className="w-16 h-16 text-light-text-tertiary dark:text-dark-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
            No filings found
          </h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            {filterYear !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters'
              : 'Generate your first tax form to see it here'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-light-border dark:divide-dark-border">
          {filings.map(filing => (
            <div
              key={filing.id}
              className="p-6 hover:bg-light-background dark:hover:bg-dark-background transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg border-2 border-primary-200 dark:border-primary-800/30">
                    <FileText className="w-6 h-6 text-primary-500" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                        {getFormTypeName(filing.form_type)} – {filing.tax_year}
                      </h3>
                      {getStatusBadge(filing.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Generated:{' '}
                        {new Date(filing.created_at).toLocaleDateString('en-NG')}
                      </span>

                      {filing.filing_status?.length ? (
                        <>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-primary-500" />
                            Filed:{' '}
                            {new Date(filing.filing_status[0].filed_date).toLocaleDateString(
                              'en-NG'
                            )}
                          </span>

                          {filing.filing_status[0].confirmation_number && (
                            <span className="text-primary-500 font-medium">
                              Confirmation: {filing.filing_status[0].confirmation_number}
                            </span>
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(filing)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
