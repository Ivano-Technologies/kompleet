"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
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
    <div className="flex h-screen bg-bg dark:bg-dark-bg overflow-hidden">
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
    </div>
  );
}
