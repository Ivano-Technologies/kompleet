
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserCog, ChevronLeft, Loader2 } from 'lucide-react';

export default function EditProfilePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to Profile
        </Link>
      </div>

      <header className="flex items-center gap-4">
        <div className="grid place-items-center w-12 h-12 rounded-lg bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border">
            <UserCog className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary" />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                Edit Profile
            </h1>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                Manage your personal information and account settings.
            </p>
        </div>
      </header>

      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor='email' className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                Email Address
              </label>
              <input
                id='email'
                type="email"
                disabled
                value="kez.ivano@gmail.com"
                className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background text-light-text-tertiary dark:text-dark-text-tertiary cursor-not-allowed"
              />
              <p className="mt-2 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                Email cannot be changed. Contact support if you need to update your email.
              </p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-300'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/profile"
                className="btn-secondary"
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
