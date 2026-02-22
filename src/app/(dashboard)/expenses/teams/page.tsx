"use client";

import { useState, useEffect } from "react";

interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export default function ExpenseTeamsPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [premiumRequired, setPremiumRequired] = useState(false);

  useEffect(() => {
    fetch("/api/expenses/workspaces")
      .then((res) => {
        if (res.status === 402) {
          setPremiumRequired(true);
          return { workspaces: [] };
        }
        if (!res.ok) throw new Error("Failed to load workspaces");
        return res.json();
      })
      .then((data) => setWorkspaces(data.workspaces ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-light-text-secondary dark:text-dark-text-secondary">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
          Expense workspaces
        </h1>
        <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Team workspaces (Premium). Create and share expense lists.
        </p>
      </div>
      {premiumRequired && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Premium required
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Upgrade to Premium to create and join workspaces.
          </p>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4">
        {workspaces.length === 0 && !premiumRequired && !error && (
          <p className="text-light-text-tertiary dark:text-dark-text-tertiary">
            No workspaces yet. Create one via API or upgrade to Premium.
          </p>
        )}
        <ul className="list-disc list-inside space-y-1">
          {workspaces.map((w) => (
            <li key={w.id}>
              {w.name} <span className="text-light-text-tertiary dark:text-dark-text-tertiary">(owner)</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
