'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, ChevronDown, Check, AlertCircle } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner', description: 'Full access including user management' },
  { value: 'admin', label: 'Admin', description: 'Full access except user management' },
  { value: 'tax_consultant', label: 'Tax Consultant', description: 'Read + reports/calculations, no data edits' },
  { value: 'user', label: 'User', description: 'Standard access, no admin' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
] as const;

interface TeamUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  email_confirmed: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function TeamManagementPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to load users');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    setOpenDropdown(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update role');
        setUpdatingId(null);
        return;
      }
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setSuccessId(userId);
      setTimeout(() => setSuccessId(null), 2000);
    } catch {
      setError('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'tax_consultant': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'user': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLE_OPTIONS.find(r => r.value === role)?.label || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(var(--primary-rgb),0.1)] rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-[rgb(var(--primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Team Management</h1>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              Manage user roles and access rights
            </p>
          </div>
        </div>
        <span className="text-sm text-[rgb(var(--text-secondary))]">{users.length} users</span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 text-sm">Dismiss</button>
        </div>
      )}

      {/* Role legend */}
      <div className="solid-card p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">Role Permissions</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ROLE_OPTIONS.map(r => (
            <div key={r.value} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(r.value)}`}>{r.label}</span>
              <span className="text-xs text-[rgb(var(--text-tertiary))]">{r.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User list */}
      <div className="solid-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgb(var(--border))]">
              <th className="text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider px-4 py-3">User</th>
              <th className="text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider px-4 py-3">Role</th>
              <th className="text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider px-4 py-3">Last Sign In</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-[rgb(var(--border))] last:border-0 hover:bg-[rgb(var(--surface))] transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{u.full_name}</p>
                    <p className="text-xs text-[rgb(var(--text-secondary))]">{u.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    u.email_confirmed
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}>
                    {u.email_confirmed ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === u.id ? null : u.id)}
                      disabled={updatingId === u.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-sm transition-colors hover:bg-[rgb(var(--surface))] disabled:opacity-50 ${
                        successId === u.id ? 'border-green-500' : ''
                      }`}
                    >
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                      {successId === u.id ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : updatingId === u.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                      )}
                    </button>

                    {openDropdown === u.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                        <div className="absolute left-0 top-full mt-1 z-20 w-64 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg shadow-lg py-1">
                          {ROLE_OPTIONS.map(r => (
                            <button
                              key={r.value}
                              onClick={() => updateRole(u.id, r.value)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-[rgb(var(--surface))] transition-colors flex items-center justify-between ${
                                u.role === r.value ? 'bg-[rgb(var(--surface))]' : ''
                              }`}
                            >
                              <div>
                                <span className="font-medium text-[rgb(var(--text-primary))]">{r.label}</span>
                                <p className="text-xs text-[rgb(var(--text-tertiary))]">{r.description}</p>
                              </div>
                              {u.role === r.value && <Check className="w-4 h-4 text-[rgb(var(--primary))]" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-[rgb(var(--text-secondary))]">
                  {u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleDateString('en-NG', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                    : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
