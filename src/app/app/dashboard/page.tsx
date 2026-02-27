import Link from "next/link";
import { DashboardKpiCards } from "./DashboardKpiCards";

const complianceRows = [
  { name: "VAT Return", due: "Filed 21 Feb 2026", status: "Filed" },
  {
    name: "WHT Remittance",
    due: "Due 7 Mar 2026",
    status: "Due in 8 days",
  },
  {
    name: "PAYE Remittance",
    due: "Was due 21 Feb 2026",
    status: "Overdue",
  },
  { name: "CIT Estimate", due: "Filed 15 Jan 2026", status: "Filed" },
];

export default function AppDashboardPage() {
  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">
            Good morning, Adaeze 👋
          </h2>
          <p className="text-sm text-text-3 dark:text-dark-text-3 mt-1">
            Friday, 27 February 2026 · Lagos, Nigeria
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="🔍  Search..."
            className="bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md px-4 py-2.5 text-sm w-48 md:w-56"
          />
          <button
            type="button"
            className="w-10 h-10 bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md flex items-center justify-center relative"
            aria-label="Notifications"
          >
            <span>🔔</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error border-2 border-surface dark:border-dark-surface" />
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <DashboardKpiCards />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg p-6 shadow-1">
          <h3 className="font-display text-base font-bold mb-6">
            Revenue vs Expenses — Feb 2026
          </h3>
          <div className="h-64 flex items-center justify-center rounded-md bg-surface-2 dark:bg-dark-surface-2 border border-border dark:border-dark-border text-text-4 dark:text-dark-text-4 text-sm">
            Chart placeholder — integrate recharts or similar
          </div>
        </div>

        {/* Compliance Widget */}
        <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg p-6 shadow-1">
          <h3 className="font-display text-base font-bold mb-4">
            Tax Compliance
          </h3>
          <div className="text-center py-4 border-b border-border dark:border-dark-border mb-4">
            <div className="font-display text-6xl font-bold text-success">
              75%
            </div>
            <div className="text-sm text-text-4 dark:text-dark-text-4 mt-1">
              Overall Compliance Score
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-md bg-success-bg dark:bg-success-darkBg">
              <div className="font-display text-2xl font-bold text-success dark:text-success-dark">
                3
              </div>
              <div className="text-xs font-bold text-text-4 dark:text-dark-text-4 uppercase tracking-wider mt-1">
                Filed
              </div>
            </div>
            <div className="text-center p-3 rounded-md bg-warning-bg dark:bg-warning-darkBg">
              <div className="font-display text-2xl font-bold text-warning dark:text-warning-dark">
                1
              </div>
              <div className="text-xs font-bold text-text-4 dark:text-dark-text-4 uppercase tracking-wider mt-1">
                Due
              </div>
            </div>
            <div className="text-center p-3 rounded-md bg-error-bg dark:bg-error-darkBg">
              <div className="font-display text-2xl font-bold text-error dark:text-error-dark">
                1
              </div>
              <div className="text-xs font-bold text-text-4 dark:text-dark-text-4 uppercase tracking-wider mt-1">
                Overdue
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {complianceRows.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between p-3 rounded-md border border-border dark:border-dark-border hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`shrink-0 w-2 h-2 rounded-full ${
                      row.status === "Filed"
                        ? "bg-success"
                        : row.status.includes("Due")
                          ? "bg-warning"
                          : "bg-error"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text-1 dark:text-dark-text-1">
                      {row.name}
                    </div>
                    <div className="text-xs text-text-4 dark:text-dark-text-4 mt-0.5 truncate">
                      {row.due}
                    </div>
                  </div>
                </div>
                {row.status.includes("Due") && (
                  <Link
                    href="/dashboard/filing"
                    className={`shrink-0 text-xs font-bold px-3 py-1 rounded-sm ${
                      row.status === "Overdue"
                        ? "bg-error text-white"
                        : "bg-primary text-white"
                    }`}
                  >
                    File Now
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
