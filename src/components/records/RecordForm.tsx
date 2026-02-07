'use client';

import { useState } from 'react';
import type { CreateRecordRequest, FinancialRecord } from '@/types/api';

interface RecordFormProps {
  record?: FinancialRecord;
  onSubmit: (data: CreateRecordRequest) => void;
  onCancel: () => void;
}

export function RecordForm({ record, onSubmit, onCancel }: RecordFormProps) {
  const [formData, setFormData] = useState<CreateRecordRequest>({
    type: record?.type || 'income',
    amount: record?.amount || 0,
    date: record?.date || new Date().toISOString().split('T')[0],
    category: record?.category || '',
    description: record?.description || '',
    taxCode: record?.taxCode || '',
    vatAmount: record?.vatAmount || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'amount' || name === 'vatAmount' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
          Type *
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount (NGN) *
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
          min="0"
          step="0.01"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          Date *
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <input
          type="text"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          placeholder="e.g., Sales, Office Supplies, Utilities"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Optional details about this record"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tax Code */}
      <div>
        <label htmlFor="taxCode" className="block text-sm font-medium text-gray-700 mb-2">
          Tax Code
        </label>
        <input
          type="text"
          id="taxCode"
          name="taxCode"
          value={formData.taxCode}
          onChange={handleChange}
          placeholder="e.g., VAT-001"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* VAT Amount */}
      <div>
        <label htmlFor="vatAmount" className="block text-sm font-medium text-gray-700 mb-2">
          VAT Amount (NGN)
        </label>
        <input
          type="number"
          id="vatAmount"
          name="vatAmount"
          value={formData.vatAmount}
          onChange={handleChange}
          min="0"
          step="0.01"
          placeholder="7.5% of amount"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {record ? 'Update Record' : 'Create Record'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
