"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info, Loader2 } from "lucide-react";

export default function GenerateTaxReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reportType: "comprehensive",
    taxYear: new Date().getFullYear(),
    periodStart: "",
    periodEnd: "",
    businessType: "other_company",
    turnover: "",
    totalAssets: "",
    isProfessionalService: false,
    totalRevenue: "",
    totalExpenses: "",
    capitalGains: "",
    capitalLosses: "",
    nonDeductibleExpenses: "",
    annualIncome: "",
    rentPaid: "",
    ownerOccupierInterest: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? value === ""
              ? ""
              : parseFloat(value)
            : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/tax-reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Failed to generate tax report");
      const data = await response.json();
      router.push(`/tax-reports/${data.report.id}`);
    } catch (error) {
      console.error("Error generating tax report:", error);
      alert("Failed to generate tax report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30";
  const labelCls =
    "block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1.5";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-400 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Tax Reports
        </button>
        <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
          Generate Tax Report
        </h1>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
          Complete the form to generate a report based on Nigeria Tax Act 2025
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Details */}
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Report Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Report Type</label>
              <select
                name="reportType"
                value={formData.reportType}
                onChange={handleChange}
                required
                className={inputCls}
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="income_tax">Income Tax Only</option>
                <option value="development_levy">Development Levy Only</option>
                <option value="vat">VAT Only</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tax Year</label>
              <input
                type="number"
                name="taxYear"
                value={formData.taxYear}
                onChange={handleChange}
                required
                min="2020"
                max="2030"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Period Start</label>
              <input
                type="date"
                name="periodStart"
                value={formData.periodStart}
                onChange={handleChange}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Period End</label>
              <input
                type="date"
                name="periodEnd"
                value={formData.periodEnd}
                onChange={handleChange}
                required
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Business Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Business Type</label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                required
                className={inputCls}
              >
                <option value="individual">Individual</option>
                <option value="small_company">Small Company</option>
                <option value="other_company">Other Company</option>
                <option value="very_large_company">Very Large Company</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Annual Turnover (₦)</label>
              <input
                type="number"
                name="turnover"
                value={formData.turnover}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Total Assets (₦)</label>
              <input
                type="number"
                name="totalAssets"
                value={formData.totalAssets}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={inputCls}
              />
            </div>
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                name="isProfessionalService"
                checked={formData.isProfessionalService}
                onChange={handleChange}
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-light-border dark:border-dark-border rounded"
              />
              <label className="ml-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Professional Service Provider
              </label>
            </div>
          </div>
        </div>

        {/* Financial Data */}
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            Financial Data
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Total Revenue (₦)</label>
              <input
                type="number"
                name="totalRevenue"
                value={formData.totalRevenue}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Total Expenses (₦)</label>
              <input
                type="number"
                name="totalExpenses"
                value={formData.totalExpenses}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Capital Gains (₦)</label>
              <input
                type="number"
                name="capitalGains"
                value={formData.capitalGains}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Capital Losses (₦)</label>
              <input
                type="number"
                name="capitalLosses"
                value={formData.capitalLosses}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Non-Deductible Expenses (₦)</label>
              <input
                type="number"
                name="nonDeductibleExpenses"
                value={formData.nonDeductibleExpenses}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Individual-Specific Fields */}
        {formData.businessType === "individual" && (
          <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
            <h2 className="text-base font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              Individual Tax Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Annual Income (₦)</label>
                <input
                  type="number"
                  name="annualIncome"
                  value={formData.annualIncome}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Rent Paid (₦)</label>
                <input
                  type="number"
                  name="rentPaid"
                  value={formData.rentPaid}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Owner-Occupier Interest (₦)</label>
                <input
                  type="number"
                  name="ownerOccupierInterest"
                  value={formData.ownerOccupierInterest}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/10">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside leading-relaxed">
            <li>
              Small companies (≤₦50m turnover, ≤₦250m assets) pay 0% income tax
            </li>
            <li>Other companies pay 30% income tax + 4% development levy</li>
            <li>Individuals earning ≤₦800,000 per annum pay 0% tax</li>
            <li>All amounts should be in Nigerian Naira (₦)</li>
          </ul>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary text-sm px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-sm px-5 py-2 flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Generating..." : "Generate Tax Report"}
          </button>
        </div>
      </form>
    </div>
  );
}
