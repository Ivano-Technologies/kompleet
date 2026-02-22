"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCount();

    // Poll for updates every 5 minutes
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/deadlines/upcoming");
      const data = await response.json();

      if (data.success) {
        // Count deadlines that are due soon (within 7 days) or overdue
        const urgentCount = data.deadlines.filter(
          (d: any) => d.status === "due_soon" || d.status === "overdue",
        ).length;

        setUnreadCount(urgentCount);
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      href="/notifications"
      className="relative p-2 rounded-lg hover:bg-light-background dark:bg-dark-background transition-colors"
      title="Notifications"
    >
      <Bell className="w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary" />
      {!loading && unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
