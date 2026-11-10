"use client";

import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard";

const SHOT_USER = {
  email: "ada@example.com",
  id: "theme-shot-user",
  role: "user",
};

const ROWS = [
  {
    id: "b1",
    date: "8 Nov 2026",
    description: "GTBank transfer — Ada Ventures",
    amount: "₦12,450,000.00",
    credit: true,
  },
  {
    id: "b2",
    date: "7 Nov 2026",
    description: "MTN airtime bulk",
    amount: "₦24,500.00",
    credit: false,
  },
  {
    id: "b3",
    date: "4 Nov 2026",
    description: "Invoice 1042 — Kano Supplies",
    amount: "₦1,250,000.00",
    credit: true,
  },
];

export default function ThemeShotBooksPage() {
  return (
    <DashboardShell user={SHOT_USER}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl text-text-1">Books</h1>
            <span className="text-xs font-medium text-text-3 bg-surface px-2.5 py-1 rounded-full border border-border">
              3 total
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              placeholder="Search transactions..."
              defaultValue=""
              className="w-full !pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-lg text-text-1 placeholder-text-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2.5 sm:px-5 py-3 text-left text-xs font-medium text-text-3 whitespace-nowrap">
                    Date
                  </th>
                  <th className="px-2.5 sm:px-5 py-3 text-left text-xs font-medium text-text-3">
                    Description
                  </th>
                  <th className="px-2.5 sm:px-5 py-3 text-right text-xs font-medium text-text-3 whitespace-nowrap w-[1%]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="px-2.5 sm:px-5 py-3.5 text-text-2 text-xs whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="px-2.5 sm:px-5 py-3.5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {row.credit ? (
                            <ArrowDown className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <ArrowUp className="w-3.5 h-3.5 text-error" />
                          )}
                        </div>
                        <span className="font-medium text-sm text-text-1 truncate block min-w-0">
                          {row.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-2.5 sm:px-5 py-3.5 text-right whitespace-nowrap w-[1%]">
                      <span
                        className={`font-semibold text-sm tabular-nums ${
                          row.credit ? "text-success" : "text-text-1"
                        }`}
                      >
                        {row.credit ? "+" : ""}
                        {row.amount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
