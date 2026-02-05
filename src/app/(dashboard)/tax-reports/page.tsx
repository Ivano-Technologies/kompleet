'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
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
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      filed: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-600',
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          styles[status as keyof typeof styles] || styles.draft
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getReportTypeLabel = (type: string) => {
    const labels = {
      income_tax: 'Income Tax',
      development_levy: 'Development Levy',
      vat: 'VAT',
      comprehensive: 'Comprehensive',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax Reports</h1>
        <p className="text-gray-600">
          Generate and manage your tax reports based on Nigeria Tax Act 2025
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          href="/tax-reports/generate"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          + Generate New Tax Report
        </Link>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={filter.taxYear || ''}
            onChange={(e) =>
              setFilter({ ...filter, taxYear: e.target.value ? parseInt(e.target.value) : undefined })
            }
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>

          <select
            value={filter.status || ''}
            onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="filed">Filed</option>
            <option value="paid">Paid</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 About Tax Reports</h3>
        <p className="text-sm text-blue-800">
          Tax reports are generated based on your transactions and financial data. They comply with the
          Nigeria Tax Act 2025 and include income tax, development levy, and VAT calculations. Use these
          reports for filing with the Nigeria Revenue Service (NRS).
        </p>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No tax reports found</p>
          <Link
            href="/tax-reports/generate"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Generate your first tax report →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tax Liability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ETR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {report.tax_year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getReportTypeLabel(report.report_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(report.period_start)} - {formatDate(report.period_end)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {report.business_classification}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(report.total_tax_liability)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {report.effective_tax_rate.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(report.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/tax-reports/${report.id}`}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Stats */}
      {reports.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Reports</p>
            <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Draft</p>
            <p className="text-2xl font-bold text-gray-900">
              {reports.filter((r) => r.status === 'draft').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Filed</p>
            <p className="text-2xl font-bold text-green-600">
              {reports.filter((r) => r.status === 'filed').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="text-2xl font-bold text-blue-600">
              {reports.filter((r) => r.status === 'paid').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
