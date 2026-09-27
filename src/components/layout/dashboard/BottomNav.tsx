"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { LogOut, MoreHorizontal, Settings, User } from "lucide-react";
import {
  MORE_NAV,
  PRIMARY_NAV,
  isMoreChildActive,
  isPrimaryActive,
} from "./nav-config";

interface BottomNavProps {
  onOpenSettings?: () => void;
}

export function BottomNav({ onOpenSettings }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [moreOpen, setMoreOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const moreActive = moreOpen || isMoreChildActive(pathname);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close more sheet"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-16 inset-x-0 rounded-t-xl border-t border-border bg-surface p-3 pb-4 max-h-[70vh] overflow-y-auto">
            <p className="px-2 pb-2 text-xs font-bold uppercase tracking-widest text-text-3">
              More
            </p>
            {MORE_NAV.map((item) => {
              const Icon = item.icon;
              const childActive =
                pathname === item.href ||
                Boolean(pathname?.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                    childActive
                      ? "bg-accent/10 text-accent"
                      : "text-text-2 hover:bg-surface-2 hover:text-text-1"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setMoreOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-text-2 hover:bg-surface-2 hover:text-text-1"
              >
                <Settings className="w-4 h-4 shrink-0" />
                Settings
              </button>
            )}
            <Link
              href="/profile"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-text-2 hover:bg-surface-2 hover:text-text-1"
            >
              <User className="w-4 h-4 shrink-0" />
              Profile
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-text-3 hover:bg-error/10 hover:text-error"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      )}

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = isPrimaryActive(item.key, pathname);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
                  active ? "text-accent" : "text-text-3"
                }`}
              >
                {active && (
                  <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-accent" />
                )}
                <Icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
              moreActive ? "text-accent" : "text-text-3"
            }`}
            aria-expanded={moreOpen}
          >
            {moreActive && (
              <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-accent" />
            )}
            <MoreHorizontal className="w-[18px] h-[18px]" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
