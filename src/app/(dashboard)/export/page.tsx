'use client';

import React, { useState, useEffect } from 'react';
import { useYear } from '@/contexts/year-context';
import { YearSelector } from '@/components/year-selector';

interface ExportHistory {
  id: string;
  export_type: string;
  format: string;
  tax_year: number | null;
  file_size: number;
  created_at: string;
  expires_at: string;
}

export default function ExportCenterPage() {
  const { selectedYear } = useYear();
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    fetchExportHistory();
  }, []);

  async function fetchExportHistory() {
    try {
      const response = await fetch('/api/export/history');
      if (response.ok) {
        const data = await response.json();
        setExportHistory(data.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch export history:', error);
    }
  }

  async function handleExport(type: string, format?: string, statementType?: string) {
    if (!consentGiven) {
      alert('Please review and accept the data export consent before proceeding.');
      return;
    }

    setIsExporting(true);
    try {
      let endpoint = '';
      let body: any = { tax_year: selectedYear };

      if (type === 'transactions') {
        endpoint = '/api/export/transactions';
        body.format = format;
      } else if (type === 'statement') {
        endpoint = '/api/export/statements';
        body.statement_type = statementType;
      } else if (type === 'bulk') {
        endpoint = '/api/export/bulk';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'export.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        // Refresh history
        fetchExportHistory();
      } else {
        alert('Export failed. Please try again.');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Export Center</h1>
          <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Download your financial data in various formats
          </p>
        </div>
        <YearSelector />
      </div>

      {/* NDPR Consent */}
      <div className="mb-8 rounded-lg bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-blue-900">Data Export Consent (NDPR Compliance)</h2>
        <p className="mt-2 text-sm text-blue-800">
          By exporting your data, you acknowledge that:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800">
          <li>Your personal and financial data will be downloaded to your device</li>
          <li>You are responsible for securing the downloaded files</li>
          <li>Export links expire after 7 days for security</li>
          <li>All exports are logged for audit purposes</li>
        </ul>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="consent"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="h-4 w-4 rounded border-light-border dark:border-dark-border text-green-600 focus:ring-green-500"
          />
          <label htmlFor="consent" className="text-sm font-medium text-blue-900">
            I understand and consent to export my data
          </label>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Transactions Export */}
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">Transactions</h3>
          </div>
          <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">Export all transactions for {selectedYear}</p>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => handleExport('transactions', 'csv')}
              disabled={isExporting || !consentGiven}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-light-border dark:bg-dark-border"
            >
              Download CSV
            </button>
            <button
              onClick={() => handleExport('transactions', 'excel')}
              disabled={isExporting || !consentGiven}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-light-border dark:bg-dark-border"
            >
              Download Excel
            </button>
          </div>
        </div>

        {/* Financial Statements Export */}
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">Financial Statements</h3>
          </div>
          <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">Export statements as Word documents</p>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => handleExport('statement', undefined, 'balance_sheet')}
              disabled={isExporting || !consentGiven}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-light-border dark:bg-dark-border"
            >
              Balance Sheet
            </button>
            <button
              onClick={() => handleExport('statement', undefined, 'pnl')}
              disabled={isExporting || !consentGiven}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-light-border dark:bg-dark-border"
            >
              Profit & Loss
            </button>
            <button
              onClick={() => handleExport('statement', undefined, 'tax_summary')}
              disabled={isExporting || !consentGiven}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-light-border dark:bg-dark-border"
            >
              Tax Summary
            </button>
          </div>
        </div>

        {/* Bulk Export */}
        <div className="rounded-lg bg-light-surface dark:bg-dark-surface p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">Bulk Export</h3>
          </div>
          <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">Download all data as ZIP archive</p>
          <div className="mt-4">
            <button
              onClick={() => handleExport('bulk')}
              disabled={isExporting || !consentGiven}
              className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-light-border dark:bg-dark-border"
            >
              Download Complete Archive
            </button>
            <p className="mt-2 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              Includes: Transactions (CSV + Excel), Balance Sheet, P&L, Tax Summary
            </p>
          </div>
        </div>
      </div>

      {/* Export History */}
      <div className="mt-8 rounded-lg bg-light-surface dark:bg-dark-surface p-6 shadow">
        <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">Export History</h2>
        <div className="mt-4 overflow-x-auto">
          {exportHistory.length === 0 ? (
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">No exports yet</p>
          ) : (
            <table className="min-w-full divide-y divide-light-border dark:divide-dark-border">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary">
                    Tax Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary">
                    Expires
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border bg-light-surface dark:bg-dark-surface">
                {exportHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-light-text-primary dark:text-dark-text-primary">
                      {item.export_type}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      {item.format}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      {item.tax_year || 'All'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      {formatFileSize(item.file_size)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      {formatDate(item.expires_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
