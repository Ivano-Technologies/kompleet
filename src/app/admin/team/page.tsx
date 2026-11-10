"use client";

import { useState, useEffect } from "react";
import { Users, Shield, ChevronDown, Check, AlertCircle } from "lucide-react";
import { apiErrorMessage, toFriendlyMessage } from "@/lib/friendly-error";
import { ErrorText } from "@/components/ui/error-ref";
import { EmptyState } from "@/components/ui/empty-state";

const ROLE_OPTIONS = [
  {
    value: "owner",
    label: "Owner",
    description: "Full access including user management",
  },
  {
    value: "admin",
    label: "Admin",
    description: "Full access except user management",
  },
  {
    value: "tax_consultant",
    label: "Tax Consultant",
    description: "Read + reports/calculations, no data edits",
  },
  { value: "user", label: "User", description: "Standard access, no admin" },
  { value: "viewer", label: "Viewer", description: "Read only access" },
] as const;

/** Empty copy must match /api/admin/users: listAll of existing accounts, no invite, PATCH 501. */
export const TEAM_EMPTY_COPY = {
  title: "No team members yet",
  description:
    "Accounts appear here after someone creates one. This page cannot send invitations, and roles cannot be changed yet.",
  intro:
    "People with a Kompleet account appear here. Role changes are not available yet.",
} as const;

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
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const data = await res.json();
        setError(apiErrorMessage(data, "We couldn't load users. Please try again."));
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(toFriendlyMessage(err, "We couldn't load users. Please try again."));
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
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(apiErrorMessage(data, "We couldn't update this role. Please try again."));
        setUpdatingId(null);
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
      setSuccessId(userId);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (err) {
      setError(toFriendlyMessage(err, "We couldn't update this role. Please try again."));
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "tax_consultant":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "user":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    return ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
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
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(var(--primary-rgb),0.1)] rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-[rgb(var(--primary))]" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            Team management
          </h1>
        </div>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          {TEAM_EMPTY_COPY.intro}
        </p>
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          {users.length} users
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-red-600 dark:text-red-400 text-sm"><ErrorText text={error} /></p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600 text-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Role legend */}
      <div className="solid-card p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
            Role permissions
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ROLE_OPTIONS.map((r) => (
            <div key={r.value} className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(r.value)}`}
              >
                {r.label}
              </span>
              <span className="text-xs text-[rgb(var(--text-tertiary))]">
                {r.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={TEAM_EMPTY_COPY.title}
          description={TEAM_EMPTY_COPY.description}
        />
      ) : (
      <>
      <div className="space-y-3 sm:hidden">
        {users.map((u) => (
          <div
            key={u.id}
            className="solid-card rounded-xl p-4 space-y-3"
          >
            <div>
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                {u.full_name}
              </p>
              <p className="text-xs text-[rgb(var(--text-secondary))]">
                {u.email}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                  u.email_confirmed
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                }`}
              >
                {u.email_confirmed ? "Verified" : "Pending"}
              </span>
              <TeamRoleSelect
                user={u}
                updatingId={updatingId}
                successId={successId}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
                updateRole={updateRole}
                getRoleBadgeColor={getRoleBadgeColor}
                getRoleLabel={getRoleLabel}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="solid-card rounded-xl overflow-hidden hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgb(var(--border))]">
              <th className="text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider px-4 py-3">
                User
              </th>
              <th className="text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider px-4 py-3">
                Role
              </th>
              <th className="text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider px-4 py-3">
                Last sign in
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-[rgb(var(--border))] last:border-0 hover:bg-[rgb(var(--surface))] transition-colors"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {u.full_name}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-secondary))]">
                      {u.email}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      u.email_confirmed
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    }`}
                  >
                    {u.email_confirmed ? "Verified" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <TeamRoleSelect
                    user={u}
                    updatingId={updatingId}
                    successId={successId}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                    updateRole={updateRole}
                    getRoleBadgeColor={getRoleBadgeColor}
                    getRoleLabel={getRoleLabel}
                  />
                </td>
                <td className="px-4 py-3 text-xs text-[rgb(var(--text-secondary))]">
                  {u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}

function TeamRoleSelect({
  user,
  updatingId,
  successId,
  openDropdown,
  setOpenDropdown,
  updateRole,
  getRoleBadgeColor,
  getRoleLabel,
}: {
  user: TeamUser;
  updatingId: string | null;
  successId: string | null;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  updateRole: (userId: string, role: string) => void;
  getRoleBadgeColor: (role: string) => string;
  getRoleLabel: (role: string) => string;
}) {
  return (
    <div className="relative">
      <button
        onClick={() =>
          setOpenDropdown(openDropdown === user.id ? null : user.id)
        }
        disabled={updatingId === user.id}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgb(var(--border))] text-sm transition-colors hover:bg-[rgb(var(--surface))] disabled:opacity-50 ${
          successId === user.id ? "border-green-500" : ""
        }`}
      >
        <span
          className={`px-1.5 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}
        >
          {getRoleLabel(user.role)}
        </span>
        {successId === user.id ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : updatingId === user.id ? (
          <div className="w-3.5 h-3.5 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
        )}
      </button>

      {openDropdown === user.id && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpenDropdown(null)}
          />
          <div className="absolute right-0 top-full mt-1 z-20 w-64 max-w-[calc(100vw-2rem)] bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg shadow-lg py-1">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => updateRole(user.id, r.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[rgb(var(--surface))] transition-colors flex items-center justify-between ${
                  user.role === r.value ? "bg-[rgb(var(--surface))]" : ""
                }`}
              >
                <div>
                  <span className="font-medium text-[rgb(var(--text-primary))]">
                    {r.label}
                  </span>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {r.description}
                  </p>
                </div>
                {user.role === r.value && (
                  <Check className="w-4 h-4 text-[rgb(var(--primary))]" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
