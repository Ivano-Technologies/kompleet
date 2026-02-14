'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EditProfilePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      setMessage({
        type: 'success',
        text: 'Profile update functionality coming soon!',
      });
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/profile" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm">
          &larr; Back to Profile
        </Link>
      </div>

      <h1 className="text-2xl lg:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
        Edit Profile
      </h1>

      <div className="bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                Email Address
              </label>
              <input
                type="email"
                disabled
                placeholder="Email managed by auth provider"
                className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface-hover dark:bg-dark-surface-hover text-light-text-primary dark:text-dark-text-primary"
              />
              <p className="mt-1 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/profile"
                className="px-6 py-2 bg-light-surface-hover dark:bg-dark-surface-hover text-light-text-primary dark:text-dark-text-primary rounded-lg hover:bg-light-border dark:hover:bg-dark-border font-medium inline-block transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
