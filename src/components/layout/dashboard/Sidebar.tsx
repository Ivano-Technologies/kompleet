"use client";

import Link from "next/link";
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  ChevronDown,
  FileText,
  LogOut,
  MoreHorizontal,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  MORE_NAV,
  PRIMARY_NAV,
  isMoreChildActive,
  isPrimaryActive,
} from "./nav-config";

interface AdminItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const adminItems: AdminItem[] = [
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/rules", label: "Tax Rules", icon: Shield },
  { href: "/admin/sources", label: "Sources", icon: FileText },
];

interface SidebarProps {
  userEmail?: string;
  userRole?: string;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onOpenSettings?: () => void;
}

export function Sidebar({
  userEmail,
  userRole,
  isMobileOpen,
  onMobileClose,
  onOpenSettings,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [signingOut, setSigningOut] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!moreOpen || !moreButtonRef.current) return;
    const rect = moreButtonRef.current.getBoundingClientRect();
    setFlyoutPos({ top: rect.top, left: rect.right + 8 });
  }, [moreOpen]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const userInitial = userEmail?.charAt(0).toUpperCase() || "U";
  const moreChildActive = isMoreChildActive(pathname);
  const moreActive = moreOpen || moreChildActive;

  const navItemBase =
    "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const navItemActive =
    "bg-accent/15 text-accent border border-accent/25 font-semibold";
  const navItemInactive = "text-white/55 hover:bg-white/10 hover:text-white";

  const morePanel = (
    <div className="w-64 rounded-xl border border-border bg-surface shadow-1 p-2">
      {MORE_NAV.map((item) => {
        const Icon = item.icon;
        const childActive =
          pathname === item.href || Boolean(pathname?.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              setMoreOpen(false);
              onMobileClose();
            }}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
    </div>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-primary-deep to-primary">
      <div className="flex items-center p-5 border-b border-white/10">
        <BrandWordmark
          href="/dashboard"
          size="md"
          tone="inverse"
          onClick={onMobileClose}
        />
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-3 pb-2 text-xs font-bold uppercase tracking-widest text-white/30">
          Main Menu
        </p>
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = isPrimaryActive(item.key, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`${navItemBase} ${active ? navItemActive : navItemInactive}`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          ref={moreButtonRef}
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className={`w-full ${navItemBase} ${moreActive ? navItemActive : navItemInactive}`}
          aria-expanded={moreOpen}
          aria-haspopup="true"
        >
          <MoreHorizontal className="w-[18px] h-[18px] shrink-0" />
          <span className="flex-1 text-left">More</span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform ${moreOpen ? "rotate-180" : ""}`}
          />
        </button>

        {moreOpen && (
          <div className="lg:hidden mt-1">{morePanel}</div>
        )}

        {onOpenSettings && (
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onMobileClose();
              setMoreOpen(false);
            }}
            className={`w-full ${navItemBase} ${
              pathname?.startsWith("/settings") ? navItemActive : navItemInactive
            }`}
          >
            <Settings className="w-[18px] h-[18px] shrink-0" />
            <span>Settings</span>
          </button>
        )}

        {(userRole === "owner" || userRole === "admin") && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="px-3 mb-1 text-xs font-bold uppercase tracking-widest text-white/30">
              Admin
            </p>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const active = Boolean(pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={`${navItemBase} ${active ? navItemActive : navItemInactive}`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/profile"
          onClick={onMobileClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            pathname?.startsWith("/profile")
              ? "bg-accent/15 text-accent"
              : "text-white/55 hover:bg-white/10 hover:text-white"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-white shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {userEmail || "User"}
            </p>
            <p className="text-xs text-white/35">Free Beta</p>
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/40 hover:bg-error/15 hover:text-error-dark transition-colors"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <span>{signingOut ? "Signing out…" : "Sign Out"}</span>
        </button>

        <a
          href="/contact?subject=bug"
          className="block text-center text-[10px] text-white/30 hover:text-white/50 mt-1.5 py-0.5 transition-colors"
          title="Report a bug"
        >
          Report a bug
        </a>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-80 shrink-0 flex-col h-screen sticky top-0 overflow-hidden shadow-outer-deep">
        {sidebarContent}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-label="Close sidebar"
          />
          <aside className="fixed inset-y-0 left-0 w-80 z-50 shadow-outer-deep overflow-hidden">
            {sidebarContent}
          </aside>
        </div>
      )}

      {moreOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="hidden lg:block">
            <button
              type="button"
              className="fixed inset-0 z-40"
              aria-label="Close more menu"
              onClick={() => setMoreOpen(false)}
            />
            <div
              className="fixed z-50"
              style={{ top: flyoutPos.top, left: flyoutPos.left }}
            >
              {morePanel}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
