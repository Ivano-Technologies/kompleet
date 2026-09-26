import {
  ArrowLeftRight,
  Calculator,
  FileSpreadsheet,
  FileText,
  FolderTree,
  History,
  LayoutDashboard,
  PieChart,
  Receipt,
  User,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PrimaryNavKey = "dashboard" | "books" | "invoices" | "tax";

export interface PrimaryNavItem {
  key: PrimaryNavKey;
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface MoreNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: PrimaryNavItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "books", href: "/transactions", label: "Books", icon: ArrowLeftRight },
  { key: "invoices", href: "/invoices", label: "Invoices", icon: Receipt },
  { key: "tax", href: "/tax", label: "Tax", icon: FileText },
];

export const MORE_NAV: MoreNavItem[] = [
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/export", label: "Export / Audit", icon: FileSpreadsheet },
  { href: "/reports/profit-loss", label: "Profit & Loss", icon: PieChart },
  { href: "/reports/balance-sheet", label: "Balance Sheet", icon: FileSpreadsheet },
  { href: "/reports/cash-flow", label: "Cash Flow", icon: FileSpreadsheet },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/calculators", label: "Calculators", icon: Calculator },
  { href: "/history", label: "History", icon: History },
  { href: "/yoy-comparison", label: "Year-over-Year", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

export const TAX_LEGACY_PREFIXES = ["/tax-reports", "/filing"] as const;

export function isDashboardActive(pathname: string | null): boolean {
  return pathname === "/dashboard";
}

export function isBooksActive(pathname: string | null): boolean {
  return Boolean(pathname?.startsWith("/transactions"));
}

export function isInvoicesActive(pathname: string | null): boolean {
  return Boolean(pathname?.startsWith("/invoices"));
}

export function isTaxActive(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/tax")) return true;
  return TAX_LEGACY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isMoreChildActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return MORE_NAV.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

export function isPrimaryActive(
  key: PrimaryNavKey,
  pathname: string | null,
): boolean {
  switch (key) {
    case "dashboard":
      return isDashboardActive(pathname);
    case "books":
      return isBooksActive(pathname);
    case "invoices":
      return isInvoicesActive(pathname);
    case "tax":
      return isTaxActive(pathname);
    default:
      return false;
  }
}
