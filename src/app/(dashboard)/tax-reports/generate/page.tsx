'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateTaxReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reportType: 'comprehensive',
    taxYear: new Date().getFullYear(),
    periodStart: '',
    periodEnd: '',
    businessType: 'other_company',
    turnover: '',
    totalAssets: '',
    isProfessionalService: false,
    totalRevenue: '',
    totalExpenses: '',
    capitalGains: '',
    capitalLosses: '',
    nonDeductibleExpenses: '',
    annualIncome: '',
    rentPaid: '',
    ownerOccupierInterest: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
          ? value === ''
            ? ''
            : parseFloat(value)
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/tax-reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tax report');
      }

      const data = await response.json();
      router.push(`/tax-reports/${data.report.id}`);
    } catch (error) {
      console.error('Error generating tax report:', error);
      alert('Failed to generate tax report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generate Tax Report</h1>
        <p className="text-gray-600">
          Complete the form below to generate a tax report based on Nigeria Tax Act 2025
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Report Details */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                name="reportType"
                value={formData.reportType}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="income_tax">Income Tax Only</option>
                <option value="development_levy">Development Levy Only</option>
                <option value="vat">VAT Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Year</label>
              <input
                type="number"
                name="taxYear"
                value={formData.taxYear}
                onChange={handleChange}
                required
                min="2020"
                max="2030"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period Start
              </label>
              <input
                type="date"
                name="periodStart"
                value={formData.periodStart}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period End</label>
              <input
                type="date"
                name="periodEnd"
                value={formData.periodEnd}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Type
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="individual">Individual</option>
                <option value="small_company">Small Company</option>
                <option value="other_company">Other Company</option>
                <option value="very_large_company">Very Large Company</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Turnover (₦)
              </label>
              <input
                type="number"
                name="turnover"
                value={formData.turnover}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Assets (₦)
              </label>
              <input
                type="number"
                name="totalAssets"
                value={formData.totalAssets}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isProfessionalService"
                checked={formData.isProfessionalService}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Professional Service Provider
              </label>
            </div>
          </div>
        </div>

        {/* Financial Data */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Revenue (₦)
              </label>
              <input
                type="number"
                name="totalRevenue"
                value={formData.totalRevenue}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Expenses (₦)
              </label>
              <input
                type="number"
                name="totalExpenses"
                value={formData.totalExpenses}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capital Gains (₦)
              </label>
              <input
                type="number"
                name="capitalGains"
                value={formData.capitalGains}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capital Losses (₦)
              </label>
              <input
                type="number"
                name="capitalLosses"
                value={formData.capitalLosses}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Non-Deductible Expenses (₦)
              </label>
              <input
                type="number"
                name="nonDeductibleExpenses"
                value={formData.nonDeductibleExpenses}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Individual-Specific Fields */}
        {formData.businessType === 'individual' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Individual Tax Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Income (₦)
                </label>
                <input
                  type="number"
                  name="annualIncome"
                  value={formData.annualIncome}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rent Paid (₦)
                </label>
                <input
                  type="number"
                  name="rentPaid"
                  value={formData.rentPaid}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner-Occupier Interest (₦)
                </label>
                <input
                  type="number"
                  name="ownerOccupierInterest"
                  value={formData.ownerOccupierInterest}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Important Notes</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Small companies (≤₦50m turnover, ≤₦250m assets) pay 0% income tax</li>
            <li>Other companies pay 30% income tax + 4% development levy</li>
            <li>Individuals earning ≤₦800,000 per annum pay 0% tax</li>
            <li>All amounts should be in Nigerian Naira (₦)</li>
          </ul>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Tax Report'}
          </button>
        </div>
      </form>
    </div>
  );
}
