"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  StatementDropZone,
  triggerStatementPicker,
} from "@/components/import/StatementDropZone";
import type { StatementUploadResult } from "@/components/import/StatementDropZone";
import { DROP_COPY } from "@/components/import/statement-copy";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface KpiData {
  totalRevenue: number;
  totalExpenses: number;
  revenueChange: number;
  estimatedTax: number;
  taxDueDate: string;
  outstandingInvoices: number;
  pendingCount: number;
  netProfit: number;
  profitChange: number;
}

interface RevenuePoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface Transaction {
  id: string;
  desc: string;
  amount: number;
  type: string;
  date: string;
  relative: string;
  status: string;
}

interface DashboardClientProps {
  kpiData: KpiData;
  revenueData: RevenuePoint[];
  recentTransactions: Transaction[];
  hasBooks: boolean;
  uncategorizedCount: number;
  duplicatesCount: number;
}

const DASHBOARD_INPUT_ID = "dashboard-statement-input";

function formatNaira(val: number) {
  const abs = Math.abs(val);
  if (abs >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (abs >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return val.toLocaleString();
}

function formatFullNaira(val: number) {
  return `₦${Math.abs(val).toLocaleString()}`;
}

export default function DashboardClient({
  kpiData,
  revenueData,
  recentTransactions,
  hasBooks,
  uncategorizedCount: initialUncategorized,
  duplicatesCount: initialDuplicates,
}: DashboardClientProps) {
  const router = useRouter();
  const [uncategorizedCount, setUncategorizedCount] =
    useState(initialUncategorized);
  const [duplicatesCount, setDuplicatesCount] = useState(initialDuplicates);
  const [toast, setToast] = useState<StatementUploadResult | null>(null);

  useEffect(() => {
    setUncategorizedCount(initialUncategorized);
    setDuplicatesCount(initialDuplicates);
  }, [initialUncategorized, initialDuplicates]);

  const handleSuccess = useCallback(
    (result: StatementUploadResult) => {
      setToast(result);
      if (result.pendingReview > 0) setUncategorizedCount(result.pendingReview);
      if (result.duplicates > 0) setDuplicatesCount(result.duplicates);
      router.refresh();
    },
    [router],
  );

  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 className="font-display text-2xl text-text-1 dark:text-dark-text-1">
        Dashboard
      </h1>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        {hasBooks ? (
          <>
            <Link
              href="/invoices/new"
              className="btn-primary text-sm px-3 py-2 text-center"
            >
              {DROP_COPY.ctaInvoice}
            </Link>
            <button
              type="button"
              className="btn-secondary text-sm px-3 py-2"
              onClick={() => triggerStatementPicker(DASHBOARD_INPUT_ID)}
            >
              {DROP_COPY.ctaImportShort}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn-primary text-sm px-3 py-2"
              onClick={() => triggerStatementPicker(DASHBOARD_INPUT_ID)}
            >
              {DROP_COPY.ctaImport}
            </button>
            <Link
              href="/invoices/new"
              className="btn-secondary text-sm px-3 py-2 text-center"
            >
              {DROP_COPY.ctaInvoice}
            </Link>
          </>
        )}
      </div>
    </div>
  );

  if (!hasBooks) {
    return (
      <div className="space-y-6">
        {header}
        <StatementDropZone
          variant="hero"
          inputId={DASHBOARD_INPUT_ID}
          onSuccess={handleSuccess}
        />
        {toast && (
          <ImportToast result={toast} onDismiss={() => setToast(null)} />
        )}
      </div>
    );
  }

  const kpis = [
    {
      label: "Revenue",
      value: formatFullNaira(kpiData.totalRevenue),
      positive: kpiData.totalRevenue > 0,
    },
    {
      label: "Expenses",
      value: formatFullNaira(kpiData.totalExpenses),
      positive: false,
    },
    {
      label: "Net",
      value: `${kpiData.netProfit < 0 ? "−" : ""}${formatFullNaira(kpiData.netProfit)}`,
      positive: kpiData.netProfit > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {header}

      {(uncategorizedCount > 0 || duplicatesCount > 0) && (
        <div className="rounded-xl border border-warning bg-warning/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-text-1 space-y-0.5">
            {uncategorizedCount > 0 && (
              <p>{DROP_COPY.bannerReview(uncategorizedCount)}</p>
            )}
            {duplicatesCount > 0 && (
              <p>{DROP_COPY.bannerDuplicates(duplicatesCount)}</p>
            )}
          </div>
          <div className="flex gap-2">
            {uncategorizedCount > 0 && (
              <Link
                href="/transactions/review"
                className="btn-secondary text-sm px-3 py-1.5"
              >
                {DROP_COPY.bannerReviewCta}
              </Link>
            )}
            {duplicatesCount > 0 && (
              <Link
                href="/transactions/duplicates"
                className="btn-secondary text-sm px-3 py-1.5"
              >
                {DROP_COPY.bannerDuplicatesCta}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5 rounded-xl">
            <p className="text-sm text-text-2">{kpi.label}</p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                kpi.positive ? "text-success" : "text-text-1"
              }`}
            >
              {kpi.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5 rounded-xl">
          <h3 className="font-semibold text-base text-text-1">Revenue trend</h3>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  vertical={false}
                />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `₦${formatNaira(Number(v))}`}
                  tick={{ fontSize: 12 }}
                  width={48}
                />
                <Tooltip
                  formatter={(v) => [`₦${Number(v).toLocaleString()}`, ""]}
                  contentStyle={{
                    backgroundColor: "#FFFDF8",
                    border: "1px solid #DDD5C8",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="revenue" fill="#0B3A5C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-semibold text-base text-text-1">
              Recent transactions
            </h3>
            <Link href="/transactions" className="text-sm font-medium text-primary">
              {DROP_COPY.toastViewBooks}
            </Link>
          </div>
          <ul className="divide-y divide-border/70">
            {recentTransactions.map((txn) => (
              <li
                key={txn.id}
                className="px-5 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-1 truncate">
                    {txn.desc}
                  </p>
                  <p className="text-xs text-text-3 mt-0.5">{txn.relative}</p>
                </div>
                <p
                  className={`text-sm font-medium shrink-0 ${
                    txn.amount > 0 ? "text-success" : "text-text-1"
                  }`}
                >
                  {txn.amount > 0 ? "+" : "−"}
                  {formatFullNaira(txn.amount)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <StatementDropZone
        variant="strip"
        inputId={DASHBOARD_INPUT_ID}
        onSuccess={handleSuccess}
      />

      {toast && <ImportToast result={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}

function ImportToast({
  result,
  onDismiss,
}: {
  result: StatementUploadResult;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed top-20 right-4 z-40 w-[min(100%-2rem,22rem)] rounded-xl border border-border bg-surface p-4 shadow-1">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-success">
            {DROP_COPY.toastSuccess(result.imported)}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            <Link href="/transactions" className="text-primary font-medium">
              {DROP_COPY.toastViewBooks}
            </Link>
            {result.pendingReview > 0 && (
              <Link
                href="/transactions/review"
                className="text-primary font-medium"
              >
                {DROP_COPY.toastReview(result.pendingReview)}
              </Link>
            )}
            {result.duplicates > 0 && (
              <Link
                href="/transactions/duplicates"
                className="text-primary font-medium"
              >
                {DROP_COPY.toastDuplicates}
              </Link>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-text-3 hover:text-text-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
