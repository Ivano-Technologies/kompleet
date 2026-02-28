"use client";

import Link from "next/link";
import { useState, useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Bug } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { SettingsModal } from "./SettingsModal";

type SettingsSection = "general" | "notifications" | "preferences" | "admin" | "legal";

interface DashboardShellProps {
  user: { email?: string | null; id: string; role?: string };
  children: ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>("general");

  useEffect(() => {
    const q = searchParams.get("settings");
    if (q === "open" || q === "notifications") {
      setSettingsSection(q === "notifications" ? "notifications" : "general");
      setSettingsOpen(true);
    }
  }, [searchParams]);

  const openSettings = (section?: SettingsSection) => {
    if (section) setSettingsSection(section);
    setSettingsOpen(true);
  };

  return (
    <div className="flex h-screen bg-bg bg-[url('/textures/noise.svg')] bg-repeat bg-[length:180px_180px] dark:bg-none dark:bg-dark-bg overflow-hidden">
      <Sidebar
        userEmail={user.email || undefined}
        userRole={user.role}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        onOpenSettings={() => openSettings()}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
          onOpenSettings={(section) => openSettings(section)}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        userRole={user.role}
        initialSection={settingsSection}
      />

      {/* Report a bug — option 3: small, low-prominence floating link */}
      <Link
        href="/contact?subject=bug"
        className="fixed bottom-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-2/90 dark:bg-dark-surface/90 border border-border dark:border-dark-border text-[11px] text-text-4 dark:text-dark-text-3 hover:text-text-2 dark:hover:text-dark-text-1 transition-colors shadow-sm"
        title="Report a bug"
      >
        <Bug className="w-3 h-3 shrink-0" />
        <span>Report a bug</span>
      </Link>
    </div>
  );
}
