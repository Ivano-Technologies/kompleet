'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, FileText, Info } from 'lucide-react';

interface TaxReport {
  id: string;
  report_type: string;
  tax_year: number;
  period_start: string;
  period_end: string;
  business_classification: string;
  total_tax_liability: number;
  effective_tax_rate: number;
  status: string;
  created_at: string;
}

export default function TaxReportsPage() {
  const [reports, setReports] = useState<TaxReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    taxYear?: number;
    status?: string;
    reportType?: string;
  }>({});

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.taxYear) params.append('taxYear', filter.taxYear.toString());
      if (filter.status) params.append('status', filter.status);
      if (filter.reportType) params.append('reportType', filter.reportType);

      const response = await fetch(`/api/tax-reports?${params.toString()}`);
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const statusStyles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400',
    filed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    archived: 'bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-500',
  };

  const reportTypeLabels: Record<string, string> = {
    income_tax: 'Income Tax',
    development_levy: 'Development Levy',
    vat: 'VAT',
    comprehensive: 'Comprehensive',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Tax Reports
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Generate and manage reports based on Nigeria Tax Act 2025
          </p>
        </div>
        <Link
          href="/tax-reports/generate"
          className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 self-start"
        >
          <Plus className="w-3.5 h-3.5" /> Generate Report
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filter.taxYear || ''}
          onChange={(e) =>
            setFilter({ ...filter, taxYear: e.target.value ? parseInt(e.target.value) : undefined })
          }
          className="px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-primary-500"
        >
          <option value="">All Years</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
        <select
          value={filter.status || ''}
          onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
          className="px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-primary-500"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="filed">Filed</option>
          <option value="paid">Paid</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Info Panel */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
          Tax reports comply with the Nigeria Tax Act 2025 and include income tax, development levy,
          and VAT calculations. Use these reports for filing with the Nigeria Revenue Service (NRS).
        </p>
      </div>

      {/* Quick Stats */}
      {reports.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Reports', value: reports.length, color: '' },
            { label: 'Draft', value: reports.filter((r) => r.status === 'draft').length, color: '' },
            { label: 'Filed', value: reports.filter((r) => r.status === 'filed').length, color: 'text-green-600 dark:text-green-400' },
            { label: 'Paid', value: reports.filter((r) => r.status === 'paid').length, color: 'text-blue-600 dark:text-blue-400' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
            >
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                {stat.label}
              </p>
              <p className={`text-xl font-bold mt-1 ${stat.color || 'text-light-text-primary dark:text-dark-text-primary'}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reports Table */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
            Loading reports...
          </p>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <FileText className="w-8 h-8 mx-auto mb-2 text-light-text-tertiary dark:text-dark-text-tertiary opacity-40" />
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">
            No tax reports found
          </p>
          <Link
            href="/tax-reports/generate"
            className="text-primary-500 hover:text-primary-400 text-sm font-medium"
          >
            Generate your first tax report →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background">
                  <th className="px-4 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    Year
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    Period
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    Classification
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    Tax Liability
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    ETR
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border/50 dark:divide-dark-border/50">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-light-text-primary dark:text-dark-text-primary">
                      {report.tax_year}
                    </td>
                    <td className="px-4 py-3 text-light-text-secondary dark:text-dark-text-secondary">
                      {reportTypeLabels[report.report_type] || report.report_type}
                    </td>
                    <td className="px-4 py-3 text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap">
                      {formatDate(report.period_start)} – {formatDate(report.period_end)}
                    </td>
                    <td className="px-4 py-3 text-light-text-secondary dark:text-dark-text-secondary">
                      {report.business_classification}
                    </td>
                    <td className="px-4 py-3 font-medium text-light-text-primary dark:text-dark-text-primary">
                      {formatCurrency(report.total_tax_liability)}
                    </td>
                    <td className="px-4 py-3 text-light-text-secondary dark:text-dark-text-secondary">
                      {report.effective_tax_rate.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusStyles[report.status] || statusStyles.draft
                        }`}
                      >
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/tax-reports/${report.id}`}
                        className="text-primary-500 hover:text-primary-400 font-medium text-xs"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
