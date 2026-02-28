"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type EmptyStateAction =
  | { label: string; href: string }
  | { label: string; onClick: () => void };

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: EmptyStateAction;
  className?: string;
}

const primaryButtonCls =
  "inline-flex items-center justify-center rounded-md font-medium transition-all select-none shadow-outer-soft gradient-convex border border-black/5 active:shadow-pressed active:gradient-concave active:translate-y-px bg-primary text-white h-10 px-4 py-2 dark:border-white/10";

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "p-10 flex flex-col items-center text-center gap-3",
        className,
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-2 gradient-convex shadow-outer-soft ring-1 ring-black/5 flex items-center justify-center text-primary dark:bg-dark-surface-2 dark:ring-white/10">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-base font-semibold text-text-1 dark:text-dark-text-1">
          {title}
        </p>
        {description && (
          <p className="text-sm text-text-3 dark:text-dark-text-3 max-w-md">
            {description}
          </p>
        )}
      </div>

      {action && "href" in action && (
        <Link href={action.href} className={primaryButtonCls}>
          {action.label}
        </Link>
      )}
      {action && "onClick" in action && (
        <button type="button" onClick={action.onClick} className={primaryButtonCls}>
          {action.label}
        </button>
      )}
    </Card>
  );
}

