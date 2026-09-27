"use client";

import { AlertCircle, FileWarning, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImportErrorAction, ImportErrorViewModel } from "@/lib/transaction-import/import-errors";
import { IMPORT_ERROR_COPY } from "@/lib/transaction-import/import-errors";

export function ImportErrorCard({
  view,
  fileLabel,
  onAction,
  onDismiss,
  className,
}: {
  view: ImportErrorViewModel;
  fileLabel?: string;
  onAction: (action: ImportErrorAction) => void;
  onDismiss: () => void;
  className?: string;
}) {
  const Icon =
    view.code === "ERR_UNSUPPORTED_FORMAT"
      ? FileWarning
      : view.code === "ERR_NETWORK"
        ? WifiOff
        : AlertCircle;

  return (
    <div
      role="alert"
      data-import-error={view.code}
      className={cn(
        "flex gap-3 items-start rounded-lg border border-error/35 bg-error/[0.08] p-3.5",
        "border-l-4 border-l-error",
        className,
      )}
    >
      <Icon className="w-5 h-5 text-error shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-1">{view.title}</p>
        <p className="mt-1 text-[13px] text-text-2 leading-snug">{view.body}</p>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <button
            type="button"
            className="btn-primary text-[13px] px-3.5 py-2"
            onClick={() => onAction(view.primary.action)}
          >
            {view.primary.label}
          </button>
          {view.secondary && (
            <button
              type="button"
              className="btn-secondary text-[13px] px-3.5 py-2"
              onClick={() => onAction(view.secondary!.action)}
            >
              {view.secondary.label}
            </button>
          )}
          {view.tertiary && (
            <button
              type="button"
              className="text-xs font-semibold text-primary underline underline-offset-2"
              onClick={() => onAction(view.tertiary!.action)}
            >
              {view.tertiary.label}
            </button>
          )}
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-3">
          {fileLabel ? (
            <p className="text-xs text-text-3 truncate">{fileLabel}</p>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="text-xs font-semibold text-primary shrink-0"
            onClick={onDismiss}
          >
            {IMPORT_ERROR_COPY.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
