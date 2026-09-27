"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { SettingsModal } from "./SettingsModal";
import { parseSettingsSection, type SettingsSection } from "./settings-types";

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
    const parsed = parseSettingsSection(q);
    if (parsed) {
      setSettingsSection(parsed);
      setSettingsOpen(true);
    } else if (q === "open") {
      setSettingsSection("general");
      setSettingsOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("dashboard-shell-scroll-lock");
    body.classList.add("dashboard-shell-scroll-lock");
    return () => {
      html.classList.remove("dashboard-shell-scroll-lock");
      body.classList.remove("dashboard-shell-scroll-lock");
    };
  }, []);

  const openSettings = (section?: SettingsSection) => {
    if (section) setSettingsSection(section);
    setSettingsOpen(true);
  };

  return (
    <div className="flex h-dvh min-h-0 bg-bg bg-[url('/textures/noise.svg')] bg-repeat bg-[length:180px_180px] dark:bg-none dark:bg-dark-bg overflow-hidden">
      <Sidebar
        userEmail={user.email || undefined}
        userRole={user.role}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        onOpenSettings={() => openSettings()}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <TopBar
          onMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
          onOpenSettings={(section) => openSettings(section)}
        />

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>

      <BottomNav onOpenSettings={() => openSettings()} />

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        userRole={user.role}
        initialSection={settingsSection}
      />
    </div>
  );
}
