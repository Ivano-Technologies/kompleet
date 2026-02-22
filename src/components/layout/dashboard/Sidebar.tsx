"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  CheckCircle,
  Copy,
  Link2,
  FileText,
  Receipt,
  Calculator,
  Tags,
  BarChart3,
  FileSpreadsheet,
  PieChart,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  User,
  Shield,
  ClipboardList,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: { href: string; label: string; icon: LucideIcon }[];
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: ArrowLeftRight,
    children: [
      { href: "/transactions/upload", label: "Upload", icon: Upload },
      { href: "/transactions/review", label: "Review", icon: CheckCircle },
      { href: "/transactions/duplicates", label: "Duplicates", icon: Copy },
      { href: "/transactions/connect", label: "Bank Connect", icon: Link2 },
    ],
  },
  {
    href: "/invoices",
    label: "Invoices",
    icon: Receipt,
  },
  {
    href: "/expenses",
    label: "Expenses",
    icon: Wallet,
    children: [{ href: "/expenses/teams", label: "Workspaces", icon: Users }],
  },
  {
    href: "/tax-reports",
    label: "Tax Reports",
    icon: FileText,
  },
  {
    href: "/calculators",
    label: "Calculators",
    icon: Calculator,
  },
  {
    href: "/categories",
    label: "Categories",
    icon: Tags,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    children: [
      { href: "/reports/profit-loss", label: "Profit & Loss", icon: PieChart },
      {
        href: "/reports/balance-sheet",
        label: "Balance Sheet",
        icon: FileSpreadsheet,
      },
      {
        href: "/reports/expense-reports",
        label: "Expense Reports",
        icon: Wallet,
      },
    ],
  },
  {
    href: "/filing",
    label: "Filing",
    icon: ClipboardList,
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

const adminItems: NavItem[] = [
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/rules", label: "Tax Rules", icon: Shield },
  { href: "/admin/sources", label: "Sources", icon: FileText },
];

interface SidebarProps {
  userEmail?: string;
  userRole?: string;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  userEmail,
  userRole,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [signingOut, setSigningOut] = useState(false);

  const toggleSection = (href: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(href);
  };

  const isChildActive = (item: NavItem) => {
    return item.children?.some((child) => pathname?.startsWith(child.href));
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const userInitial = userEmail?.charAt(0).toUpperCase() || "U";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-light-border dark:border-dark-border">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
          onClick={onMobileClose}
        >
          <Image
            src="/assets/logo-primary.png"
            alt="KOMPLEET Logo"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
            KOMPLEET
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const childActive = isChildActive(item);
          const expanded = expandedSections.has(item.href) || childActive;
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.href}>
              <div className="flex items-center">
                <Link
                  href={item.href}
                  onClick={onMobileClose}
                  className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active || childActive
                      ? "bg-primary-500 text-white"
                      : "text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover hover:text-light-text-primary dark:hover:text-dark-text-primary"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
                {hasChildren && (
                  <button
                    onClick={() => toggleSection(item.href)}
                    className={`p-1.5 rounded-md transition-colors ${
                      active || childActive
                        ? "text-white/70 hover:text-white"
                        : "text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-primary dark:hover:text-dark-text-primary"
                    }`}
                    aria-label={`Toggle ${item.label} submenu`}
                  >
                    {expanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Children */}
              {hasChildren && expanded && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-light-border dark:border-dark-border pl-3">
                  {item.children!.map((child) => {
                    const ChildIcon = child.icon;
                    const childIsActive = pathname?.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onMobileClose}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                          childIsActive
                            ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium"
                            : "text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover hover:text-light-text-primary dark:hover:text-dark-text-primary"
                        }`}
                      >
                        <ChildIcon className="w-4 h-4 shrink-0" />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Admin Section — visible to owner and admin roles */}
        {(userRole === "owner" || userRole === "admin") && (
          <div className="mt-4 pt-3 border-t border-light-border dark:border-dark-border">
            <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-light-text-tertiary dark:text-dark-text-tertiary">
              Admin
            </p>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary-500 text-white"
                      : "text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover hover:text-light-text-primary dark:hover:text-dark-text-primary"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-light-border dark:border-dark-border space-y-1">
        <Link
          href="/profile"
          onClick={onMobileClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname?.startsWith("/profile")
              ? "bg-primary-500/10 text-primary-600 dark:text-primary-400"
              : "text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-surface-hover dark:hover:bg-dark-surface-hover hover:text-light-text-primary dark:hover:text-dark-text-primary"
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate">{userEmail || "User"}</p>
          </div>
        </Link>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onMobileClose}
            aria-label="Close sidebar"
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-light-surface dark:bg-dark-surface border-r border-light-border dark:border-dark-border z-50 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
