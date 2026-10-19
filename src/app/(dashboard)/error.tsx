"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { ErrorRef } from "@/components/ui/error-ref";
import { useBoundaryRef } from "@/hooks/use-error-ref";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Reports and logs the raw error with the ref; never renders it.
  const ref = useBoundaryRef(error, "error-boundary:dashboard");

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-4">
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
          Something went wrong
        </h2>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary max-w-md">
          An unexpected error occurred. Please try again.
        </p>
        <ErrorRef value={ref} />
      </div>
      <button
        onClick={reset}
        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );
}
