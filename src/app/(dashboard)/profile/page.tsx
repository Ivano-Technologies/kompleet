import { requireAuth } from '@/lib/auth';
import Link from 'next/link';

export default async function ProfilePage() {
  const user = await requireAuth();

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
        Profile Settings
      </h1>

      <div className="bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border p-6">
        <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
          Profile Information
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface-hover dark:bg-dark-surface-hover text-light-text-primary dark:text-dark-text-primary"
            />
            <p className="mt-1 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              Your email address is managed by your authentication provider.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              User ID
            </label>
            <input
              type="text"
              value={user.id}
              disabled
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface-hover dark:bg-dark-surface-hover text-light-text-primary dark:text-dark-text-primary font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Account Created
            </label>
            <input
              type="text"
              value={user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              disabled
              className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-surface-hover dark:bg-dark-surface-hover text-light-text-primary dark:text-dark-text-primary"
            />
          </div>
        </div>
      </div>

      <div className="bg-light-surface dark:bg-dark-surface rounded-xl border border-light-border dark:border-dark-border p-6">
        <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
          Account Actions
        </h2>
        <div className="space-y-3">
          <Link
            href="/settings"
            className="block w-full px-4 py-3 text-left text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors font-medium"
          >
            Go to Settings
          </Link>
          <Link
            href="/forgot-password"
            className="block w-full px-4 py-3 text-left text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors font-medium"
          >
            Change Password
          </Link>
        </div>
      </div>
    </div>
  );
}
