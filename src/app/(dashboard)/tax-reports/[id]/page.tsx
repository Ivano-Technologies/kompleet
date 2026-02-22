"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  FileCheck,
  AlertTriangle,
  Info,
} from "lucide-react";

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

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tax-reports/${params.id}`);
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const updateStatus = async (newStatus: string) => {
    if (!report) return;
    try {
      setUpdating(true);
      const response = await fetch(`/api/tax-reports/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          filed_at:
            newStatus === "filed" ? new Date().toISOString() : undefined,
          paid_at: newStatus === "paid" ? new Date().toISOString() : undefined,
        }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
          Loading tax report...
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-16 text-center">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Tax report not found
        </p>
      </div>
    );
  }

  const computation = report.computation_data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-400 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Reports
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Tax Report {report.tax_year}
            </h1>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
              {formatDate(report.period_start)} –{" "}
              {formatDate(report.period_end)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            {report.status === "draft" && (
              <button
                onClick={() => updateStatus("filed")}
                disabled={updating}
                className="btn-primary text-sm px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              >
                <FileCheck className="w-3.5 h-3.5" /> Mark as Filed
              </button>
            )}
            {report.status === "filed" && (
              <button
                onClick={() => updateStatus("paid")}
                disabled={updating}
                className="btn-primary text-sm px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Mark as Paid
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-8 text-center">
        <h1 className="text-2xl font-bold">TAX COMPUTATION REPORT</h1>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Nigeria Tax Act 2025
        </p>
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Tax Year {report.tax_year} | {formatDate(report.period_start)} –{" "}
          {formatDate(report.period_end)}
        </p>
      </div>

      {/* Business Classification */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
          Business Classification
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              Classification
            </p>
            <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary mt-0.5">
              {report.business_classification}
            </p>
          </div>
          <div>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              Small Company Status
            </p>
            <p className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary mt-0.5">
              {report.qualifies_as_small_company
                ? "Qualifies"
                : "Does Not Qualify"}
            </p>
          </div>
        </div>
      </div>

      {/* Tax Computation Summary */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
          Tax Computation Summary
        </h2>
        <div className="space-y-0 divide-y divide-light-border/50 dark:divide-dark-border/50">
          {[
            {
              label: "Total Revenue",
              value: formatCurrency(report.total_revenue),
            },
            {
              label: "Deductible Expenses",
              value: formatCurrency(computation?.deductibleExpenses || 0),
            },
            {
              label: "Assessable Profit",
              value: formatCurrency(report.assessable_profit),
            },
            {
              label: "Taxable Income",
              value: formatCurrency(report.taxable_income),
            },
            { label: "Income Tax", value: formatCurrency(report.income_tax) },
            ...(report.development_levy > 0
              ? [
                  {
                    label: "Development Levy (4%)",
                    value: formatCurrency(report.development_levy),
                  },
                ]
              : []),
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between py-2.5 text-sm"
            >
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                {row.label}
              </span>
              <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                {row.value}
              </span>
            </div>
          ))}
          <div className="flex justify-between py-3 mt-1 bg-primary-500/5 dark:bg-primary-500/10 px-3 rounded-lg">
            <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
              Total Tax Liability
            </span>
            <span className="font-bold text-primary-500 text-lg">
              {formatCurrency(report.total_tax_liability)}
            </span>
          </div>
          <div className="flex justify-between py-2.5 text-sm">
            <span className="text-light-text-secondary dark:text-dark-text-secondary">
              Effective Tax Rate
            </span>
            <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
              {report.effective_tax_rate.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Tax Breakdown */}
      {computation?.taxBreakdown && computation.taxBreakdown.length > 0 && (
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Detailed Breakdown
          </h2>
          <div className="divide-y divide-light-border/50 dark:divide-dark-border/50">
            {computation.taxBreakdown.map((item: any, index: number) => (
              <div key={index} className="flex justify-between py-2.5 text-sm">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">
                  {item.description}
                  {item.rate && (
                    <span className="text-light-text-tertiary dark:text-dark-text-tertiary">
                      {" "}
                      ({item.rate}%)
                    </span>
                  )}
                </span>
                <span
                  className={`font-medium ${item.amount < 0 ? "text-red-600 dark:text-red-400" : "text-light-text-primary dark:text-dark-text-primary"}`}
                >
                  {formatCurrency(Math.abs(item.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reliefs & Exemptions */}
      {(computation?.reliefs?.length > 0 ||
        computation?.exemptions?.length > 0) && (
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Reliefs & Exemptions
          </h2>
          {computation.reliefs?.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Tax Reliefs Applied
              </h3>
              <div className="space-y-2">
                {computation.reliefs.map((relief: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30"
                  >
                    <div className="flex justify-between mb-0.5">
                      <span className="text-sm font-medium text-green-800 dark:text-green-300">
                        {relief.name}
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(relief.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400/80">
                      {relief.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {computation.exemptions?.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Exemptions
              </h3>
              <div className="space-y-2">
                {computation.exemptions.map((exemption: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30"
                  >
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-0.5">
                      {exemption.name}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-400/80">
                      {exemption.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filing Checklist */}
      {computation?.filingRequirements &&
        computation.filingRequirements.length > 0 && (
          <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface print:break-before-page">
            <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              Filing Checklist
            </h2>
            <div className="space-y-2">
              {computation.filingRequirements.map(
                (requirement: string, index: number) => (
                  <div key={index} className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 text-primary-500 focus:ring-primary-500 border-light-border dark:border-dark-border rounded print:hidden"
                    />
                    <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {requirement}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

      {/* Next Steps */}
      {computation?.nextSteps && computation.nextSteps.length > 0 && (
        <div className="p-5 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold text-blue-900 dark:text-blue-200">
              Next Steps
            </h2>
          </div>
          <ol className="list-decimal list-inside space-y-1.5">
            {computation.nextSteps.map((step: string, index: number) => (
              <li
                key={index}
                className="text-sm text-blue-800 dark:text-blue-300"
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Disclaimer
          </p>
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          This tax report is generated based on the Nigeria Tax Act 2025 and
          related acts effective January 1, 2026. Tax laws are subject to
          interpretation and may be updated through circulars from the Nigeria
          Revenue Service. For complex matters, consult a qualified Nigerian tax
          professional.
        </p>
      </div>

      {/* Report Metadata */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              Generated
            </p>
            <p className="font-medium text-light-text-primary dark:text-dark-text-primary mt-0.5">
              {formatDate(report.created_at)}
            </p>
          </div>
          <div>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              Status
            </p>
            <p className="font-medium text-light-text-primary dark:text-dark-text-primary mt-0.5 capitalize">
              {report.status}
            </p>
          </div>
          {report.filed_at && (
            <div>
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                Filed
              </p>
              <p className="font-medium text-light-text-primary dark:text-dark-text-primary mt-0.5">
                {formatDate(report.filed_at)}
              </p>
            </div>
          )}
          {report.paid_at && (
            <div>
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                Paid
              </p>
              <p className="font-medium text-light-text-primary dark:text-dark-text-primary mt-0.5">
                {formatDate(report.paid_at)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
