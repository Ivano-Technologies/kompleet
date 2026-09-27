"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function DocsToast({
  title,
  actionLabel,
  onAction,
  actionHref,
  secondaryLabel,
  onSecondary,
  tone = "success",
  placement = "top",
  onDismiss,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  tone?: "success" | "nudge";
  placement?: "top" | "bottom";
  onDismiss: () => void;
}) {
  const hasPrimary = Boolean(actionLabel && (onAction || actionHref));
  const hasSecondary = Boolean(secondaryLabel && onSecondary);

  return (
    <div
      role="status"
      className={cn(
        "fixed right-4 z-40 w-[min(100%-2rem,22rem)] rounded-xl border border-border bg-surface p-4 shadow-1",
        placement === "bottom"
          ? "bottom-24 lg:bottom-7"
          : "top-20",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-semibold leading-snug",
              tone === "nudge" ? "text-text-1" : "text-success",
            )}
          >
            {title}
          </p>
          {(hasPrimary || hasSecondary) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {hasPrimary &&
                (actionHref ? (
                  <Link href={actionHref} className="btn-primary text-xs px-3 py-1.5">
                    {actionLabel}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn-primary text-xs px-3 py-1.5"
                    onClick={onAction}
                  >
                    {actionLabel}
                  </button>
                ))}
              {hasSecondary && (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary underline underline-offset-2"
                  onClick={onSecondary}
                >
                  {secondaryLabel}
                </button>
              )}
            </div>
          )}
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
