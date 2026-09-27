"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { ImportErrorViewModel } from "@/lib/transaction-import/import-errors";
import { IMPORT_ERROR_COPY } from "@/lib/transaction-import/import-errors";

export function ImportErrorToast({
  view,
  onRetry,
  onDismiss,
}: {
  view: ImportErrorViewModel;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 8000);
    return () => window.clearTimeout(timer);
  }, [onDismiss, view.code]);

  return (
    <div
      role="status"
      className="fixed top-20 right-4 z-40 w-[min(100%-2rem,20rem)] rounded-lg border border-border bg-surface p-3.5 shadow-2 border-l-4 border-l-error"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-error">{view.toastTitle}</p>
          <p className="mt-1 text-[13px] font-semibold text-text-1 leading-snug">
            {view.toastBody ?? view.title}
          </p>
          <div className="mt-2.5 flex gap-3">
            <button
              type="button"
              className="text-xs font-semibold text-primary underline underline-offset-2"
              onClick={onRetry}
            >
              Retry
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-primary underline underline-offset-2"
              onClick={onDismiss}
            >
              {IMPORT_ERROR_COPY.dismiss}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-text-3 hover:text-text-1"
          aria-label={IMPORT_ERROR_COPY.dismiss}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
