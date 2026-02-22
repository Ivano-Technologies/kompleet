"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface Deadline {
  id: string;
  form_type: string;
  tax_year: number;
  deadline_date: string;
  description: string;
  status: "upcoming" | "due_soon" | "overdue";
  days_remaining: number;
}
interface Reminder {
  id: string;
  deadline_id: string;
  reminder_date: string;
  sent: boolean;
  email_sent_at?: string;
}

export default function NotificationsPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    enabled: true,
    email: true,
    inApp: true,
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [dRes, rRes, pRes] = await Promise.all([
        fetch("/api/deadlines/upcoming"),
        fetch("/api/reminders/history"),
        fetch("/api/notifications/preferences"),
      ]);
      const [dData, rData, pData] = await Promise.all([
        dRes.json(),
        rRes.json(),
        pRes.json(),
      ]);
      if (dData.success) setDeadlines(dData.deadlines);
      if (rData.success) setReminders(rData.reminders);
      if (pData.success) setPreferences(pData.preferences);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = async (key: "enabled" | "email" | "inApp") => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const statusStyle: Record<
    string,
    { bg: string; icon: typeof Clock; iconColor: string }
  > = {
    upcoming: {
      bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      icon: Clock,
      iconColor: "text-blue-500",
    },
    due_soon: {
      bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      icon: AlertCircle,
      iconColor: "text-yellow-500",
    },
    overdue: {
      bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      icon: AlertCircle,
      iconColor: "text-red-500",
    },
  };

  const formNames: Record<string, string> = {
    PIT: "Personal Income Tax",
    CIT: "Company Income Tax",
    VAT_Q1: "VAT Return - Q1",
    VAT_Q2: "VAT Return - Q2",
    VAT_Q3: "VAT Return - Q3",
    VAT_Q4: "VAT Return - Q4",
  };

  const Toggle = ({
    on,
    disabled,
    onToggle,
  }: {
    on: boolean;
    disabled?: boolean;
    onToggle: () => void;
  }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on && !disabled ? "bg-primary-500" : "bg-light-border dark:bg-dark-border dark:bg-light-text-tertiary dark:bg-dark-text-tertiary"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${on && !disabled ? "translate-x-[18px]" : "translate-x-[3px]"}`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-primary-500" />
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Notifications
            </h1>
          </div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Stay on top of your tax filing deadlines
          </p>
        </div>
        <Link
          href="/settings"
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
        >
          <Settings className="w-3 h-3" /> Settings
        </Link>
      </div>

      {/* Preferences */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
          Notification Preferences
        </h2>
        <div className="space-y-3">
          {[
            {
              key: "enabled" as const,
              title: "Enable Notifications",
              sub: "Receive deadline reminders",
              noDisable: true,
            },
            {
              key: "email" as const,
              title: "Email Notifications",
              sub: "Receive reminders via email",
            },
            {
              key: "inApp" as const,
              title: "In-App Notifications",
              sub: "Show notifications in the app",
            },
          ].map((p) => (
            <div key={p.key} className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                  {p.title}
                </h3>
                <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                  {p.sub}
                </p>
              </div>
              <Toggle
                on={preferences[p.key]}
                disabled={!p.noDisable && !preferences.enabled}
                onToggle={() => togglePreference(p.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden">
        <div className="p-5 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
              Upcoming Deadlines
            </h2>
          </div>
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-0.5">
            {deadlines.length} deadline{deadlines.length !== 1 ? "s" : ""} in
            the next 30 days
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
            <span className="ml-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Loading...
            </span>
          </div>
        ) : deadlines.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle className="w-8 h-8 text-primary-300 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-0.5">
              All caught up!
            </h3>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              No upcoming deadlines in the next 30 days
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {deadlines.map((d) => {
              const s = statusStyle[d.status] || statusStyle.upcoming;
              const Icon = s.icon;
              return (
                <div
                  key={d.id}
                  className="p-4 hover:bg-light-background/50 dark:hover:bg-dark-background/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg border ${s.bg} shrink-0`}>
                        <Icon className={`w-4 h-4 ${s.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                          {formNames[d.form_type] || d.form_type}
                        </h3>
                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                          {d.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs">
                          <span className="flex items-center gap-1 text-light-text-tertiary dark:text-dark-text-tertiary">
                            <Calendar className="w-3 h-3" />
                            {new Date(d.deadline_date).toLocaleDateString(
                              "en-NG",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                          <span
                            className={`font-semibold ${d.days_remaining < 0 ? "text-red-500" : d.days_remaining <= 7 ? "text-yellow-500" : "text-primary-500"}`}
                          >
                            {d.days_remaining < 0
                              ? `${Math.abs(d.days_remaining)}d overdue`
                              : `${d.days_remaining}d remaining`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/filing"
                      className="btn-primary text-xs px-3 py-1.5 shrink-0"
                    >
                      File Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reminder History */}
      <div className="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface overflow-hidden">
        <div className="p-5 border-b border-light-border dark:border-dark-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
              Reminder History
            </h2>
          </div>
        </div>
        {reminders.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="w-6 h-6 mx-auto mb-2 text-light-text-tertiary dark:text-dark-text-tertiary opacity-40" />
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              No reminders sent yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {reminders.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {r.sent ? (
                    <CheckCircle className="w-3.5 h-3.5 text-primary-500" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-light-text-tertiary dark:text-dark-text-tertiary" />
                  )}
                  <span className="text-sm text-light-text-primary dark:text-dark-text-primary">
                    Reminder for{" "}
                    {new Date(r.reminder_date).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <span
                  className={`text-xs ${r.sent ? "text-primary-500" : "text-light-text-tertiary dark:text-dark-text-tertiary"}`}
                >
                  {r.sent
                    ? r.email_sent_at
                      ? `Sent ${new Date(r.email_sent_at).toLocaleDateString("en-NG")}`
                      : "Sent"
                    : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
