import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string;
    direction: "up" | "down";
  };
  subtitle?: string;
  className?: string;
  variant?: "default" | "light" | "dark";
}

/**
 * StatCard - Metric display card (skeuomorphic)
 */
export function StatCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  className,
  variant = "default",
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "p-6",
        variant === "light" && "bg-surface-2",
        variant === "dark" && "dark:bg-dark-surface-2",
        className,
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-text-3 dark:text-dark-text-3 mb-1">
            {title}
          </p>
        </div>
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-surface-2 gradient-concave shadow-inner-subtle ring-1 ring-black/5 text-primary dark:bg-dark-surface-2 dark:ring-white/10">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-3xl font-bold text-text-1 dark:text-dark-text-1 mb-1">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-text-3 dark:text-dark-text-3">
              {subtitle}
            </p>
          )}
        </div>

        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md shadow-inner-subtle ring-1 ring-black/5",
              trend.direction === "up"
                ? "text-green-600 bg-green-500/10"
                : "text-red-600 bg-red-500/10",
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {trend.value}
          </div>
        )}
      </div>
    </Card>
  );
}
