'use client';

import { useState } from 'react';
import type { FinancialRecord } from '@/types/api';

interface RecordsListProps {
  records: FinancialRecord[];
  onEdit?: (record: FinancialRecord) => void;
  onDelete?: (recordId: string) => void;
}

export function RecordsList({ records, onEdit, onDelete }: RecordsListProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  const filteredRecords = records.filter(
    (record) => selectedType === 'all' || record.type === selectedType
  );

  const formatCurrency = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedType === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:bg-dark-border'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedType('income')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedType === 'income'
              ? 'bg-green-600 text-white'
              : 'bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:bg-dark-border'
          }`}
        >
          Income
        </button>
        <button
          onClick={() => setSelectedType('expense')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedType === 'expense'
              ? 'bg-red-600 text-white'
              : 'bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:bg-dark-border'
          }`}
        >
          Expenses
        </button>
      </div>

      {/* Records Table */}
      <div className="bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-light-background dark:bg-dark-background border-b border-light-border dark:border-dark-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-light-text-tertiary dark:text-dark-text-tertiary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-dark-border">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-light-text-tertiary dark:text-dark-text-tertiary">
                  No records found
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-light-background dark:bg-dark-background">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text-primary dark:text-dark-text-primary">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        record.type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text-primary dark:text-dark-text-primary">
                    {record.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary max-w-xs truncate">
                    {record.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-light-text-primary dark:text-dark-text-primary">
                    {formatCurrency(record.amount, record.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(record)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(record.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
