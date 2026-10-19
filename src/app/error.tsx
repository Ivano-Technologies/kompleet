"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { ErrorRef } from "@/components/ui/error-ref";
import { useBoundaryRef } from "@/hooks/use-error-ref";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Reports and logs the raw error with the ref; never renders it.
  const ref = useBoundaryRef(error, "error-boundary:app");

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            An unexpected error occurred. Please try again.
          </p>
          <ErrorRef value={ref} />
        </div>
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-[rgb(var(--primary))] text-white hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
