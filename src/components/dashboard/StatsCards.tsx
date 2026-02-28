"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface StatCard {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: ReactNode;
}

interface StatsCardsProps {
  stats: StatCard[];
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-primary">{stat.icon}</span>
            {stat.change && (
              <span
                className={`text-sm font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : stat.changeType === "negative"
                      ? "text-red-600"
                      : "text-text-3 dark:text-dark-text-3"
                }`}
              >
                {stat.change}
              </span>
            )}
          </div>
          <p className="text-sm text-text-3 dark:text-dark-text-3 mb-1">
            {stat.label}
          </p>
          <p className="text-2xl font-bold text-text-1 dark:text-dark-text-1">
            {stat.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
