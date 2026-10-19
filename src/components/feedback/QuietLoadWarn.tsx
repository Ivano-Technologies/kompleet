"use client";

import { AlertTriangle } from "lucide-react";
import { ErrorText } from "@/components/ui/error-ref";

export const QUIET_500_COPY = {
  duplicatesStrip: "Couldn’t load duplicates. Try again.",
  duplicatesToast: "Couldn’t load duplicates. Try again.",
  formsStrip: "Couldn’t load forms. Try again.",
  formsToast: "Couldn’t load forms. Try again.",
  retry: "Retry",
  unavailable: "Unavailable right now",
} as const;

export function QuietLoadWarn({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="status"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border px-3.5 py-2.5 bg-warning/10 border-warning/35"
    >
      <p className="text-sm text-text-1 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0" aria-hidden />
        <span>
          <ErrorText text={message} context="quiet-load" />
        </span>
      </p>
      <button
        type="button"
        className="btn-secondary text-sm px-3 py-1.5 self-start sm:self-auto"
        onClick={onRetry}
      >
        {QUIET_500_COPY.retry}
      </button>
    </div>
  );
}
