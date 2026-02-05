'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface TaxReport {
  id: string;
  report_type: string;
  tax_year: number;
  period_start: string;
  period_end: string;
  business_classification: string;
  qualifies_as_small_company: boolean;
  total_revenue: number;
  total_expenses: number;
  assessable_profit: number;
  taxable_income: number;
  income_tax: number;
  development_levy: number;
  total_tax_liability: number;
  effective_tax_rate: number;
  computation_data: any;
  status: string;
  created_at: string;
  filed_at?: string;
  paid_at?: string;
  payment_reference?: string;
}

export default function TaxReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [report, setReport] = useState<TaxReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [params.id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tax-reports/${params.id}`);
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!report) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/tax-reports/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          filed_at: newStatus === 'filed' ? new Date().toISOString() : undefined,
          paid_at: newStatus === 'paid' ? new Date().toISOString() : undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600">Loading tax report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Tax report not found</p>
      </div>
    );
  }

  const computation = report.computation_data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header - Hide on print */}
      <div className="mb-8 print:hidden">
        <button
          onClick={() => router.back()}
          className="text-green-600 hover:text-green-700 mb-4"
        >
          ← Back to Reports
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tax Report {report.tax_year}</h1>
            <p className="text-gray-600">
              {formatDate(report.period_start)} - {formatDate(report.period_end)}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              🖨️ Print / PDF
            </button>
            {report.status === 'draft' && (
              <button
                onClick={() => updateStatus('filed')}
                disabled={updating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Mark as Filed
              </button>
            )}
            {report.status === 'filed' && (
              <button
                onClick={() => updateStatus('paid')}
                disabled={updating}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Mark as Paid
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Print Header - Show only on print */}
      <div className="hidden print:block mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">TAX COMPUTATION REPORT</h1>
        <p className="text-gray-600">Nigeria Tax Act 2025</p>
        <p className="text-gray-600">Tax Year {report.tax_year}</p>
        <p className="text-gray-600">
          Period: {formatDate(report.period_start)} - {formatDate(report.period_end)}
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Business Classification */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Classification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Classification</p>
              <p className="text-lg font-medium text-gray-900">{report.business_classification}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Small Company Status</p>
              <p className="text-lg font-medium text-gray-900">
                {report.qualifies_as_small_company ? '✅ Qualifies' : '❌ Does Not Qualify'}
              </p>
            </div>
          </div>
        </div>

        {/* Tax Computation Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax Computation Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Total Revenue</span>
              <span className="font-medium text-gray-900">{formatCurrency(report.total_revenue)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Deductible Expenses</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(computation.deductibleExpenses)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Assessable Profit</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(report.assessable_profit)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Taxable Income</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(report.taxable_income)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-700">Income Tax</span>
              <span className="font-medium text-gray-900">{formatCurrency(report.income_tax)}</span>
            </div>
            {report.development_levy > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-700">Development Levy (4%)</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(report.development_levy)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-3 bg-green-50 px-4 rounded-lg">
              <span className="text-lg font-semibold text-gray-900">Total Tax Liability</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(report.total_tax_liability)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-700">Effective Tax Rate</span>
              <span className="font-medium text-gray-900">{report.effective_tax_rate.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Tax Breakdown */}
        {computation.taxBreakdown && computation.taxBreakdown.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Breakdown</h2>
            <div className="space-y-2">
              {computation.taxBreakdown.map((item: any, index: number) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-700">
                    {item.description}
                    {item.rate && <span className="text-sm text-gray-500"> ({item.rate}%)</span>}
                  </span>
                  <span
                    className={`font-medium ${
                      item.amount < 0 ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {formatCurrency(Math.abs(item.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reliefs & Exemptions */}
        {(computation.reliefs?.length > 0 || computation.exemptions?.length > 0) && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reliefs & Exemptions</h2>

            {computation.reliefs?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Tax Reliefs Applied</h3>
                <div className="space-y-2">
                  {computation.reliefs.map((relief: any, index: number) => (
                    <div key={index} className="bg-green-50 p-3 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-green-900">{relief.name}</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(relief.amount)}
                        </span>
                      </div>
                      <p className="text-sm text-green-700">{relief.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {computation.exemptions?.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Exemptions</h3>
                <div className="space-y-2">
                  {computation.exemptions.map((exemption: any, index: number) => (
                    <div key={index} className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium text-blue-900 mb-1">{exemption.name}</p>
                      <p className="text-sm text-blue-700">{exemption.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filing Checklist */}
        {computation.filingRequirements && computation.filingRequirements.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 print:break-before-page">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Filing Checklist</h2>
            <div className="space-y-2">
              {computation.filingRequirements.map((requirement: string, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded print:hidden"
                  />
                  <span className="text-gray-700">{requirement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {computation.nextSteps && computation.nextSteps.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">🎯 Next Steps</h2>
            <ol className="list-decimal list-inside space-y-2">
              {computation.nextSteps.map((step: string, index: number) => (
                <li key={index} className="text-blue-800">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900 mb-2">⚠️ Disclaimer</p>
          <p>
            This tax report is generated based on the Nigeria Tax Act 2025 and related acts effective
            January 1, 2026. Tax laws are subject to interpretation and may be updated through circulars
            from the Nigeria Revenue Service. For complex matters or significant transactions, consult a
            qualified Nigerian tax professional.
          </p>
        </div>

        {/* Report Metadata */}
        <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-900">Report Generated</p>
              <p>{formatDate(report.created_at)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Status</p>
              <p className="capitalize">{report.status}</p>
            </div>
            {report.filed_at && (
              <div>
                <p className="font-medium text-gray-900">Filed Date</p>
                <p>{formatDate(report.filed_at)}</p>
              </div>
            )}
            {report.paid_at && (
              <div>
                <p className="font-medium text-gray-900">Paid Date</p>
                <p>{formatDate(report.paid_at)}</p>
              </div>
            )}
            {report.payment_reference && (
              <div>
                <p className="font-medium text-gray-900">Payment Reference</p>
                <p>{report.payment_reference}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
