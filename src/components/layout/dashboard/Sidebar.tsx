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
  BarChart3,
  FileSpreadsheet,
  PieChart,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
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
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
    children: [
      { href: "/tax-reports", label: "Tax Reports", icon: FileText },
      { href: "/filing", label: "Filing", icon: ClipboardList },
      { href: "/reports/profit-loss", label: "Profit & Loss", icon: PieChart },
      {
        href: "/reports/balance-sheet",
        label: "Balance Sheet",
        icon: FileSpreadsheet,
      },
      { href: "/reports/expense-reports", label: "Expense Reports", icon: Wallet },
      { href: "/reports", label: "Compliance Reports", icon: FileText },
      { href: "/export", label: "Audit Exports", icon: FileSpreadsheet },
    ],
  },
  {
    href: "/calculators",
    label: "Calculators",
    icon: Calculator,
    children: [
      { href: "/calculators/business-tax", label: "CIT Calculator", icon: Calculator },
      { href: "/calculators/individual-tax", label: "PIT Calculator", icon: Calculator },
      { href: "/calculators/vat", label: "VAT Calculator", icon: Calculator },
      { href: "/calculators/stamp-duty", label: "Stamp Duty", icon: Calculator },
      { href: "/calculators/capital-allowances", label: "Capital Allowances", icon: Calculator },
      { href: "/calculators/property-tax", label: "Property Tax", icon: Calculator },
    ],
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

  // Shared class helpers using approved design tokens
  const navItemBase =
    "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors";
  const navItemActive =
    "bg-accent/15 text-accent border border-accent/25 font-semibold";
  const navItemInactive =
    "text-white/55 hover:bg-white/10 hover:text-white";
  const childItemActive =
    "bg-accent/10 text-accent font-medium";
  const childItemInactive =
    "text-white/50 hover:bg-white/10 hover:text-white";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-primary-deep to-primary">
      {/* Logo */}
      <div className="flex items-center gap-3 p-5 border-b border-white/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
          onClick={onMobileClose}
        >
          <Image
            src="/logo.png"
            alt="KOMPLEET Logo"
            width={34}
            height={34}
            className="rounded-lg shadow-4"
          />
          <span className="font-display text-base font-bold text-white tracking-wider">
            KOMPLEET
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-3 pb-2 text-xs font-bold uppercase tracking-widest text-white/30">
          Main Menu
        </p>
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
                  className={`${navItemBase} ${
                    active || childActive ? navItemActive : navItemInactive
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
                        ? "text-accent/70 hover:text-accent"
                        : "text-white/30 hover:text-white/70"
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
                <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-white/10 pl-3">
                  {item.children!.map((child) => {
                    const ChildIcon = child.icon;
                    const childIsActive = pathname?.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onMobileClose}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                          childIsActive ? childItemActive : childItemInactive
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

        {/* Settings — opens modal */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onMobileClose();
            }}
            className={`w-full ${navItemBase} ${
              pathname?.startsWith("/settings") ? navItemActive : navItemInactive
            }`}
          >
            <Settings className="w-[18px] h-[18px] shrink-0" />
            <span>Settings</span>
          </button>
        )}

        {/* Admin Section */}
        {(userRole === "owner" || userRole === "admin") && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="px-3 mb-1 text-xs font-bold uppercase tracking-widest text-white/30">
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
                  className={`${navItemBase} ${
                    active ? navItemActive : navItemInactive
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
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/profile"
          onClick={onMobileClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            pathname?.startsWith("/profile")
              ? "bg-accent/15 text-accent"
              : "text-white/55 hover:bg-white/10 hover:text-white"
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-display text-sm font-bold text-charcoal shrink-0">
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
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col h-screen sticky top-0 overflow-hidden">
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
          <aside className="fixed inset-y-0 left-0 w-72 z-50 shadow-5 overflow-hidden">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
