"use client";

import Link from "next/link";
import { X } from "lucide-react";

export function DocsToast({
  title,
  actionLabel,
  onAction,
  actionHref,
  onDismiss,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed top-20 right-4 z-40 w-[min(100%-2rem,22rem)] rounded-xl border border-border bg-surface p-4 shadow-1">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-success">{title}</p>
          {(actionLabel && onAction) || (actionLabel && actionHref) ? (
            <div className="mt-2">
              {actionHref ? (
                <Link href={actionHref} className="text-sm font-medium text-primary">
                  {actionLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  className="text-sm font-medium text-primary"
                  onClick={onAction}
                >
                  {actionLabel}
                </button>
              )}
            </div>
          ) : null}
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
