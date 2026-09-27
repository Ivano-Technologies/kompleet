"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  FileText,
  PieChart,
} from "lucide-react";
import TaxReportsPage from "../tax-reports/page";
import FilingCenterPage from "../filing/page";
import { GenerateFromBooksCard } from "@/components/tax/GenerateFromBooksCard";
import { TAX_COPY } from "@/components/tax/tax-copy";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "reports", label: "Reports" },
  { id: "filing", label: "Filing" },
  { id: "statements", label: "Statements" },
  { id: "calculators", label: "Calculators" },
] as const;

type TaxTab = (typeof TABS)[number]["id"];

function isTaxTab(value: string | null): value is TaxTab {
  return TABS.some((tab) => tab.id === value);
}

const STATEMENTS = [
  {
    href: "/reports/profit-loss",
    label: "Profit & Loss",
    description: "Income, expenses, and net for the period.",
    icon: PieChart,
  },
  {
    href: "/reports/balance-sheet",
    label: "Balance Sheet",
    description: "Assets, liabilities, and equity snapshot.",
    icon: FileSpreadsheet,
  },
  {
    href: "/reports/cash-flow",
    label: "Cash Flow",
    description: "Money in and out across the period.",
    icon: FileSpreadsheet,
  },
];

const CALCULATORS = [
  { href: "/calculators/business-tax", label: "CIT", hint: "Company income tax" },
  { href: "/calculators/individual-tax", label: "PIT", hint: "Personal income tax" },
  { href: "/calculators/vat", label: "VAT", hint: "7.5% estimate" },
  { href: "/calculators/stamp-duty", label: "Stamp duty", hint: "Contracts & receipts" },
  { href: "/calculators/capital-allowances", label: "Capital allowances", hint: "Asset relief" },
  { href: "/calculators/property-tax", label: "Property tax", hint: "Land use / tenement" },
];

export default function TaxHubPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-text-3">Loading tax…</p>}
    >
      <TaxHubInner />
    </Suspense>
  );
}

function TaxHubInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: TaxTab = isTaxTab(rawTab) ? rawTab : "overview";

  const setTab = (next: TaxTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `/tax?${qs}` : "/tax", { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-text-1 dark:text-dark-text-1">
          {TAX_COPY.title}
        </h1>
        <p className="text-sm text-text-2 dark:text-dark-text-2 mt-1">
          Reports, filing packages, statements, and estimates in one place.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Tax hub"
        className="flex flex-wrap gap-1 border-b border-border dark:border-dark-border"
      >
        {TABS.map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                selected
                  ? "border-accent text-accent"
                  : "border-transparent text-text-3 hover:text-text-1"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <TaxOverview />}
      {tab === "reports" && <TaxReportsPage embedded />}
      {tab === "filing" && <FilingCenterPage embedded />}
      {tab === "statements" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATEMENTS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-border bg-surface p-5 hover:border-border-hover transition-colors"
              >
                <Icon className="w-5 h-5 text-text-2 mb-3" />
                <h2 className="text-sm font-semibold text-text-1">{item.label}</h2>
                <p className="text-xs text-text-3 mt-1">{item.description}</p>
              </Link>
            );
          })}
        </div>
      )}
      {tab === "calculators" && (
        <div className="space-y-4">
          <p className="text-sm text-text-2">
            Short estimates. Open the full suite anytime from More.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CALCULATORS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-border bg-surface px-4 py-3 hover:border-border-hover transition-colors"
              >
                <p className="text-sm font-semibold text-text-1">{item.label}</p>
                <p className="text-xs text-text-3 mt-0.5">{item.hint}</p>
              </Link>
            ))}
          </div>
          <Link href="/calculators" className="inline-flex text-sm font-medium text-primary">
            All calculators
          </Link>
        </div>
      )}
    </div>
  );
}

function TaxOverview() {
  const now = new Date();
  const nextVat = new Date(now.getFullYear(), now.getMonth() + 1, 21);
  if (nextVat <= now) nextVat.setMonth(nextVat.getMonth() + 1);
  const vatLabel = nextVat.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-text-3">
            VAT return
          </p>
          <p className="mt-2 font-display text-lg text-text-1">Due {vatLabel}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-text-3">
            CIT estimate
          </p>
          <p className="mt-2 text-sm text-text-2">From imported books</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-text-3">
            PIT
          </p>
          <p className="mt-2 text-sm text-text-2">Individual filings</p>
        </div>
      </div>
      <GenerateFromBooksCard />
      <div className="rounded-xl border border-border bg-surface p-5 flex items-start gap-3">
        <FileText className="w-4 h-4 text-text-2 mt-0.5 shrink-0" />
        <p className="text-sm text-text-2">
          Filing packages and tax reports now live here. Bookmark{" "}
          <span className="font-medium text-text-1">/tax</span> — older{" "}
          <span className="font-medium text-text-1">/filing</span> and{" "}
          <span className="font-medium text-text-1">/tax-reports</span> links
          still work.
        </p>
      </div>
    </div>
  );
}
