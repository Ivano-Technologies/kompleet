"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bell, ChevronRight, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/transactions/upload": "Upload Transactions",
  "/transactions/review": "Review Transactions",
  "/transactions/duplicates": "Duplicate Resolution",
  "/transactions/connect": "Bank Connect",
  "/invoices": "Invoices",
  "/invoices/new": "New Invoice",
  "/tax-reports": "Tax Reports",
  "/tax-reports/generate": "Generate Tax Report",
  "/calculators": "Calculators",
  "/calculators/individual-tax": "Individual Tax Calculator",
  "/calculators/business-tax": "Business Tax Calculator",
  "/calculators/vat": "VAT Calculator",
  "/calculators/stamp-duty": "Stamp Duty Calculator",
  "/calculators/capital-allowances": "Capital Allowances",
  "/calculators/property-tax": "Property Tax Calculator",
  "/calculators/history": "Calculation History",
  "/categories": "Categories",
  "/reports": "Reports",
  "/reports/profit-loss": "Profit & Loss",
  "/reports/balance-sheet": "Balance Sheet",
  "/reports/cash-flow": "Cash Flow",
  "/reports/tax-summary": "Tax Summary",
  "/reports/expense-reports": "Expense Reports",
  "/filing": "Tax Filing",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/profile": "Profile",
  "/profile/edit": "Edit Profile",
  "/export": "Export Data",
  "/history": "History",
  "/yoy-comparison": "Year-over-Year Comparison",
  "/ml-governance": "ML Governance",
};

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const title = pageTitles[currentPath];
    if (title) {
      crumbs.push({ label: title, href: currentPath });
    }
  }

  return crumbs;
}

interface TopBarProps {
  onMenuToggle: () => void;
  onOpenSettings?: (section?: "general" | "notifications" | "preferences" | "admin" | "legal") => void;
}

export function TopBar({ onMenuToggle, onOpenSettings }: TopBarProps) {
  const pathname = usePathname();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const breadcrumbs = getBreadcrumbs(pathname || "/dashboard");
  const pageTitle = pageTitles[pathname || ""] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 bg-bg dark:bg-dark-bg border-b border-border dark:border-dark-border px-4 lg:px-6">
      <div className="flex items-center justify-between h-14">
        {/* Left: hamburger + breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-text-2 dark:text-dark-text-2 hover:bg-surface-2 dark:hover:bg-dark-surface-hover transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs (desktop) */}
          <nav
            className="hidden sm:flex items-center gap-1 text-sm"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-text-3 dark:text-dark-text-3" />
                )}
                {i === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-text-1 dark:text-dark-text-1">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-text-2 dark:text-dark-text-2 hover:text-text-1 dark:hover:text-dark-text-1 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
            {breadcrumbs.length === 0 && (
              <span className="font-medium text-text-1 dark:text-dark-text-1">
                {pageTitle}
              </span>
            )}
          </nav>

          {/* Mobile: just page title */}
          <span className="sm:hidden font-medium text-text-1 dark:text-dark-text-1 text-sm">
            {pageTitle}
          </span>
        </div>

        {/* Right: Theme toggle + Notifications/Settings */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-text-2 dark:text-dark-text-2 hover:bg-surface-2 dark:hover:bg-dark-surface-hover transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => onOpenSettings("notifications")}
              className="p-2 rounded-lg text-text-2 dark:text-dark-text-2 hover:bg-surface-2 dark:hover:bg-dark-surface-hover transition-colors relative"
              aria-label="Notifications and settings"
            >
              <Bell className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
