/**
 * Import History Dashboard
 * Shows past import sessions with stats
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface ImportSession {
  id: string;
  file_name: string;
  bank_code: string;
  status: 'processing' | 'completed' | 'failed';
  transactions_imported: number;
  total_amount: number;
  errors_count: number;
  created_at: string;
  completed_at?: string;
  errorsCount: number;
  duplicatesCount: number;
}

export function ImportHistory() {
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/transactions/import-history?limit=20');
      const data = await response.json();

      if (response.ok) {
        setSessions(data.sessions || []);
      } else {
        setError(data.error || 'Failed to load history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted">Loading import history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-error/10 border border-error rounded-lg">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted">No import history yet</p>
        <p className="text-sm text-muted mt-2">
          Upload your first bank statement to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Import History</h2>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="p-4 bg-surface border border-border rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-foreground">
                    {session.file_name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      session.status === 'completed'
                        ? 'bg-success/20 text-success'
                        : session.status === 'failed'
                        ? 'bg-error/20 text-error'
                        : 'bg-warning/20 text-warning'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted">Bank</p>
                    <p className="font-medium text-foreground">
                      {session.bank_code}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted">Imported</p>
                    <p className="font-medium text-foreground">
                      {session.transactions_imported || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted">Duplicates</p>
                    <p className="font-medium text-foreground">
                      {session.duplicatesCount || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted">Errors</p>
                    <p className="font-medium text-foreground">
                      {session.errorsCount || 0}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted mt-2">
                  {new Date(session.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
