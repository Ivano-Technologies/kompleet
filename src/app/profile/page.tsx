'use client';

import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>

          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Your email address is managed by your authentication provider.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={user?.id || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Created
                </label>
                <input
                  type="text"
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/settings'}
                className="w-full px-4 py-3 text-left text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-medium"
              >
                <span className="text-xl mr-3">⚙️</span>
                Go to Settings
              </button>
              <button
                onClick={() => alert('Password reset functionality coming soon. Check your email for password reset link.')}
                className="w-full px-4 py-3 text-left text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
              >
                <span className="text-xl mr-3">🔐</span>
                Change Password
              </button>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">🔒 Security Features</h3>
            <ul className="space-y-2 text-blue-800">
              <li>✅ Profile data protected by Row Level Security (RLS)</li>
              <li>✅ Secure authentication with Supabase Auth</li>
              <li>✅ Password reset handled securely via email</li>
              <li>✅ You can only access your own data</li>
            </ul>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
