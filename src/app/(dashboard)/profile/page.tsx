import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { User, Settings, Lock } from "lucide-react";

export default async function ProfilePage() {
  const user = await requireAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="flex items-center gap-4 mb-8">
        <User className="w-8 h-8 text-light-text-secondary dark:text-dark-text-secondary" />
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Profile Settings
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Manage your account details and preferences.
          </p>
        </div>
      </header>

      <div className="space-y-8">
        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">
            Profile Information
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email || ""}
                disabled
                className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary"
              />
              <p className="mt-2 text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
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
                className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                Account Created
              </label>
              <input
                type="text"
                value={
                  user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "N/A"
                }
                disabled
                className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary"
              />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">
            Account Actions
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/settings"
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Go to Settings
            </Link>
            <Link
              href="/forgot-password"
              className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
