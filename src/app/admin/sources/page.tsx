'use client';

/**
 * Admin: Manage Regulatory Sources
 * Allows compliance team to view and manage tax law sources
 */

import { useEffect, useState } from 'react';
import type { Source } from '@/types/tax';

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tax/sources');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sources');
      }

      setSources(data.sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getSourceBadgeColor = (type: string) => {
    return type === 'primary'
      ? 'bg-green-100 text-green-800'
      : 'bg-blue-100 text-blue-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
          <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            Regulatory Sources
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            Manage tax law sources and monitoring schedules
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow p-6">
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Total Sources</div>
            <div className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
              {sources.length}
            </div>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow p-6">
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Primary Sources</div>
            <div className="text-3xl font-bold text-green-600">
              {sources.filter((s) => s.type === 'primary').length}
            </div>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow p-6">
            <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">Secondary Sources</div>
            <div className="text-3xl font-bold text-blue-600">
              {sources.filter((s) => s.type === 'secondary').length}
            </div>
          </div>
        </div>

        {/* Sources List */}
        <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-light-border dark:border-dark-border">
            <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">All Sources</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {sources.map((source) => (
              <div key={source.id} className="p-6 hover:bg-light-background dark:bg-dark-background">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
                        {source.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getSourceBadgeColor(source.type)}`}
                      >
                        {source.type}
                      </span>
                    </div>

                    {source.description && (
                      <p className="text-light-text-secondary dark:text-dark-text-secondary mb-3">{source.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                      <div>
                        <span className="font-medium">Check Frequency:</span>{' '}
                        Every {source.check_frequency_days} days
                      </div>
                      <div>
                        <span className="font-medium">Last Checked:</span>{' '}
                        {formatDate(source.last_checked_at)}
                      </div>
                    </div>

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                    >
                      Visit Source
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-background dark:bg-dark-background">
                      Check Now
                    </button>
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
