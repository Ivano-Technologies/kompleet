"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { createBrowserClient as createClient } from "@/lib/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import {
  X,
  Settings as SettingsIcon,
  User,
  Shield,
  Lock,
  Bell,
  Globe,
  Sun,
  Moon,
  Monitor,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  FileText,
  Users,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsSection = "general" | "notifications" | "preferences" | "admin" | "legal";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string;
  initialSection?: SettingsSection;
}

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:border-primary-500 transition-colors";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
        on ? "bg-primary-500" : "bg-light-border dark:bg-dark-border"
      )}
      aria-pressed={on}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
          on ? "translate-x-[18px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}

export function SettingsModal({
  open,
  onOpenChange,
  userRole,
  initialSection = "general",
}: SettingsModalProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [section, setSection] = useState<SettingsSection>(initialSection);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    avatar: "",
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [language, setLanguage] = useState("English (US)");
  const [currency, setCurrency] = useState("NGN - Nigerian Naira");
  const [timezone, setTimezone] = useState("GMT+01:00, West Africa Time");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const isAdmin = userRole === "owner" || userRole === "admin";

  useEffect(() => {
    if (open) setSection(initialSection);
  }, [open, initialSection]);

  useEffect(() => {
    if (open) fetchProfile();
  }, [open]);

  const fetchProfile = async () => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setProfile({
          firstName: user.user_metadata?.first_name || "",
          lastName: user.user_metadata?.last_name || "",
          email: user.email || "",
          bio: user.user_metadata?.bio || "",
          avatar: user.user_metadata?.avatar_url || "",
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const supabase = await createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName,
          bio: profile.bio,
        },
      });
      if (updateError) throw updateError;
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
          confirmPassword: passwordForm.confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to change password");
      } else {
        setSuccess("Password updated successfully!");
        setShowPasswordChange(false);
        setPasswordForm({ current: "", new: "", confirm: "" });
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = prompt(
      "Type DELETE to permanently delete your account. This action cannot be undone."
    );
    if (confirmText !== "DELETE") return;
    setDeleteLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText: "DELETE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete account");
      } else {
        onOpenChange(false);
        router.push("/login");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setDeleteLoading(false);
    }
  };

  const navSections: { id: SettingsSection; label: string; icon: typeof User }[] = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Preferences", icon: Globe },
    ...(isAdmin ? [{ id: "admin" as const, label: "Admin", icon: Shield }] : []),
    { id: "legal", label: "Legal", icon: FileText },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface",
          "max-sm:inset-0 max-sm:left-0 max-sm:top-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:h-full max-sm:max-h-none max-sm:rounded-none",
          "sm:w-[calc(100%-2rem)] sm:max-w-3xl sm:max-h-[85vh] sm:rounded-lg md:max-w-4xl"
        )}
        onPointerDownOutside={(e) => onOpenChange(false)}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <div className="flex flex-col md:flex-row h-full max-h-[90vh] sm:max-h-[85vh]">
          {/* Left: section nav */}
          <nav
            className="flex md:flex-col md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background p-2 gap-0.5 overflow-x-auto md:overflow-y-auto"
            aria-label="Settings sections"
          >
            {navSections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left whitespace-nowrap transition-colors",
                  section === id
                    ? "bg-primary-500 text-white"
                    : "text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover hover:text-light-text-primary dark:hover:text-dark-text-primary"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Right: content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
            <DialogTitle className="sr-only">Settings</DialogTitle>

            {success && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* General: Profile & Security */}
            {section === "general" && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background">
                  <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                    Profile
                  </h2>
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-4">
                    Manage your public-facing details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) =>
                          setProfile({ ...profile, firstName: e.target.value })
                        }
                        className={inputCls}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className={inputCls + " opacity-80"}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                      Bio
                    </label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      rows={2}
                      className={inputCls + " resize-none"}
                      placeholder="A brief description..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    Save profile
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background">
                  <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-1">
                    Security
                  </h2>
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-4">
                    Password and authentication
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Lock className="w-4 h-4 text-yellow-500 shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                          Password
                        </h3>
                        <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                          Change your account password
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswordChange(!showPasswordChange)
                      }
                      className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                    >
                      {showPasswordChange ? "Cancel" : "Change"}
                    </button>
                  </div>
                  {showPasswordChange && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                      <input
                        type="password"
                        placeholder="Current password"
                        value={passwordForm.current}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            current: e.target.value,
                          })
                        }
                        className={inputCls}
                      />
                      <input
                        type="password"
                        placeholder="New password (min 8 characters)"
                        value={passwordForm.new}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            new: e.target.value,
                          })
                        }
                        className={inputCls}
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordForm.confirm}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirm: e.target.value,
                          })
                        }
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={handleChangePassword}
                        disabled={
                          passwordLoading ||
                          !passwordForm.current ||
                          !passwordForm.new ||
                          !passwordForm.confirm
                        }
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {passwordLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : null}
                        Update password
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-800/30 bg-light-background dark:bg-dark-background">
                  <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
                    Danger zone
                  </h2>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                        Delete account
                      </h3>
                      <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                        Permanently remove your account and all data
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      {deleteLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {section === "notifications" && (
              <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background space-y-4">
                <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                  Notifications
                </h2>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                      Push notifications
                    </h3>
                    <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                      Deadline and activity alerts
                    </p>
                  </div>
                  <Toggle
                    on={notificationsEnabled}
                    onToggle={() =>
                      setNotificationsEnabled(!notificationsEnabled)
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                      Marketing emails
                    </h3>
                    <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                      Product updates and offers
                    </p>
                  </div>
                  <Toggle
                    on={marketingEmails}
                    onToggle={() => setMarketingEmails(!marketingEmails)}
                  />
                </div>
              </div>
            )}

            {/* Preferences */}
            {section === "preferences" && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background">
                  <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
                    Language & region
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                        Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className={inputCls}
                      >
                        <option>English (US)</option>
                        <option>English (UK)</option>
                        <option>French</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                        Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className={inputCls}
                      >
                        <option>GMT+01:00, West Africa Time</option>
                        <option>GMT+00:00, Greenwich Mean Time</option>
                        <option>GMT-05:00, Eastern Standard Time</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background">
                  <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    Currency
                  </h2>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={inputCls}
                  >
                    <option>NGN - Nigerian Naira</option>
                    <option>USD - US Dollar</option>
                    <option>GBP - British Pound</option>
                  </select>
                </div>
                <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background">
                  <label className="block text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        value: "light" as const,
                        label: "Light",
                        Icon: Sun,
                        iconColor: "text-yellow-500",
                      },
                      {
                        value: "dark" as const,
                        label: "Dark",
                        Icon: Moon,
                        iconColor: "text-blue-400",
                      },
                      {
                        value: "system" as const,
                        label: "System",
                        Icon: Monitor,
                        iconColor:
                          "text-light-text-tertiary dark:text-dark-text-tertiary",
                      },
                    ].map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => {
                          if (t.value === "system") {
                            const systemPrefersDark = window.matchMedia(
                              "(prefers-color-scheme: dark)"
                            ).matches;
                            setTheme(systemPrefersDark ? "dark" : "light");
                          } else {
                            setTheme(t.value);
                          }
                        }}
                        className={cn(
                          "py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2 text-sm",
                          theme === t.value
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background hover:border-primary-500/30"
                        )}
                      >
                        <t.Icon className={cn("w-4 h-4", t.iconColor)} />
                        <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                          {t.label}
                        </span>
                        {theme === t.value && (
                          <CheckCircle className="w-3 h-3 text-primary-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Admin (role-gated) */}
            {section === "admin" && isAdmin && (
              <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background space-y-3">
                <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                  Admin
                </h2>
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-4">
                  Team, tax rules, sources, and org-wide configuration
                </p>
                <div className="space-y-2">
                  <Link
                    href="/admin/team"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
                  >
                    <Users className="w-4 h-4 text-primary-500 shrink-0" />
                    <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                      Team
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-light-text-tertiary dark:text-dark-text-tertiary ml-auto" />
                  </Link>
                  <Link
                    href="/admin/rules"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
                  >
                    <Shield className="w-4 h-4 text-primary-500 shrink-0" />
                    <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                      Tax rules
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-light-text-tertiary dark:text-dark-text-tertiary ml-auto" />
                  </Link>
                  <Link
                    href="/admin/sources"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
                  >
                    <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                    <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                      Sources
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-light-text-tertiary dark:text-dark-text-tertiary ml-auto" />
                  </Link>
                </div>
              </div>
            )}

            {/* Legal */}
            {section === "legal" && (
              <div className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background space-y-3">
                <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                  Legal
                </h2>
                <div className="space-y-2">
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
                  >
                    <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                    <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                      Privacy Policy
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-light-text-tertiary dark:text-dark-text-tertiary ml-auto" />
                  </Link>
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-light-border dark:border-dark-border hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors"
                  >
                    <FileText className="w-4 h-4 text-primary-500 shrink-0" />
                    <span className="font-medium text-light-text-primary dark:text-dark-text-primary">
                      Terms of Service
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-light-text-tertiary dark:text-dark-text-tertiary ml-auto" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Close button - top right */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 p-1.5 rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover transition-colors z-10"
          aria-label="Close settings"
        >
          <X className="w-5 h-5" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
