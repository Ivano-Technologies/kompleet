"use client";

import { AnimatedCounter } from "@/components/ui/animated-counter";

const kpiData = [
  {
    label: "Total Revenue",
    value: 4850000,
    change: 18.4,
    changeType: "up" as const,
    prefix: "₦",
  },
  {
    label: "Total Expenses",
    value: 1240500,
    change: 6.2,
    changeType: "down" as const,
    prefix: "₦",
  },
  {
    label: "Net Profit",
    value: 3609500,
    change: 24.1,
    changeType: "up" as const,
    prefix: "₦",
  },
  {
    label: "Outstanding Invoices",
    value: 920000,
    change: 3,
    changeType: "neutral" as const,
    prefix: "₦",
    suffix: " pending",
  },
];

function KpiCard({
  label,
  value,
  change,
  changeType,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  change: number;
  changeType: "up" | "down" | "neutral";
  prefix: string;
  suffix?: string;
}) {
  const changeClass =
    changeType === "up"
      ? "bg-success-bg text-success dark:bg-success-darkBg dark:text-success-dark"
      : changeType === "down"
        ? "bg-error-bg text-error dark:bg-error-darkBg dark:text-error-dark"
        : "bg-warning-bg text-warning dark:bg-warning-darkBg dark:text-warning-dark";
  const arrow = changeType === "up" ? "↑" : changeType === "down" ? "↓" : "→";

  return (
    <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg p-6 shadow-1 hover:shadow-3 hover:-translate-y-0.5 transition-all">
      <div className="text-xs font-bold text-text-4 dark:text-dark-text-4 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="font-display text-3xl font-bold text-text-1 dark:text-dark-text-1">
        <AnimatedCounter
          value={value}
          prefix={prefix}
          duration={1.2}
          separator=","
        />
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${changeClass}`}
        >
          {arrow} {change}%
        </span>
        <span className="text-xs text-text-4 dark:text-dark-text-4">
          {suffix ?? "vs last month"}
        </span>
      </div>
    </div>
  );
}

export function DashboardKpiCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {kpiData.map((kpi) => (
        <KpiCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          change={kpi.change}
          changeType={kpi.changeType}
          prefix={kpi.prefix}
          suffix={kpi.suffix}
        />
      ))}
    </div>
  );
}
