'use client';

/**
 * Admin: Manage Tax Rules
 * Allows compliance team to view and manage tax rule versions
 */

import { useEffect, useState } from 'react';
import type { TaxRule } from '@/types/tax';

export default function AdminRulesPage() {
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchRules();
  }, [selectedType]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const url =
        selectedType === 'all'
          ? '/api/tax/rules'
          : `/api/tax/rules?rule_type=${selectedType}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch rules');
      }

      setRules(data.rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadge = (level: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const ruleTypes = [
    { value: 'all', label: 'All Rules' },
    { value: 'individual_income_tax', label: 'Individual Income Tax' },
    { value: 'business_tax', label: 'Business Tax' },
    { value: 'vat', label: 'VAT' },
    { value: 'stamp_duty', label: 'Stamp Duty' },
    { value: 'capital_allowance', label: 'Capital Allowance' },
    { value: 'development_levy', label: 'Development Levy' },
    { value: 'property_tax', label: 'Property Tax' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-light-border dark:bg-dark-border rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-light-border dark:bg-dark-border rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-light-border dark:bg-dark-border rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Tax Rules</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Manage tax rules and calculation logic
          </p>
        </div>

        {/* Filter */}
        <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Filter by Rule Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ruleTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow p-6">
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Total Rules</div>
            <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
              {rules.length}
            </div>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow p-6">
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">High Confidence</div>
            <div className="text-3xl font-bold text-green-600">
              {rules.filter((r) => r.confidence_level === 'high').length}
            </div>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow p-6">
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Medium Confidence</div>
            <div className="text-3xl font-bold text-yellow-600">
              {rules.filter((r) => r.confidence_level === 'medium').length}
            </div>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow p-6">
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Low Confidence</div>
            <div className="text-3xl font-bold text-red-600">
              {rules.filter((r) => r.confidence_level === 'low').length}
            </div>
          </div>
        </div>

        {/* Rules List */}
        <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-light-border dark:border-dark-border">
            <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Active Rules
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <div key={rule.id} className="p-6 hover:bg-light-background dark:bg-dark-background">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                        {rule.rule_key}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceBadge(rule.confidence_level)}`}
                      >
                        {rule.confidence_level} confidence
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary">
                        {rule.rule_type}
                      </span>
                    </div>

                    <div className="bg-light-background dark:bg-dark-background rounded p-3 mb-3 font-mono text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(rule.rule_value, null, 2)}
                      </pre>
                    </div>

                    {rule.notes && (
                      <p className="text-light-text-secondary dark:text-dark-text-secondary mb-3">{rule.notes}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      <div>
                        <span className="font-medium">Last Reviewed:</span>{' '}
                        {formatDate(rule.last_reviewed_at)}
                      </div>
                      {rule.source && (
                        <div>
                          <span className="font-medium">Source:</span>{' '}
                          {rule.source.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
