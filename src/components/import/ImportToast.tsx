"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { StatementUploadResult } from "./StatementDropZone";
import { DROP_COPY } from "./statement-copy";

export function ImportToast({
  result,
  onDismiss,
  viewBooksHref = "/transactions",
}: {
  result: StatementUploadResult;
  onDismiss: () => void;
  viewBooksHref?: string;
}) {
  return (
    <div className="fixed top-20 right-4 z-40 w-[min(100%-2rem,22rem)] rounded-xl border border-border bg-surface p-4 shadow-1">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-success">
            {DROP_COPY.toastSuccess(result.imported)}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            <Link href={viewBooksHref} className="text-primary font-medium">
              {DROP_COPY.toastViewBooks}
            </Link>
            {result.pendingReview > 0 && (
              <Link
                href="/transactions/review"
                className="text-primary font-medium"
              >
                {DROP_COPY.toastReview(result.pendingReview)}
              </Link>
            )}
            {result.duplicates > 0 && (
              <Link
                href="/transactions/duplicates"
                className="text-primary font-medium"
              >
                {DROP_COPY.toastDuplicates}
              </Link>
            )}
          </div>
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

export function ExceptionBanner({
  uncategorizedCount,
  duplicatesCount,
}: {
  uncategorizedCount: number;
  duplicatesCount: number;
}) {
  if (uncategorizedCount <= 0 && duplicatesCount <= 0) return null;

  return (
    <div className="rounded-xl border border-warning bg-warning/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="text-sm text-text-1 space-y-0.5">
        {uncategorizedCount > 0 && (
          <p>{DROP_COPY.bannerReview(uncategorizedCount)}</p>
        )}
        {duplicatesCount > 0 && (
          <p>{DROP_COPY.bannerDuplicates(duplicatesCount)}</p>
        )}
      </div>
      <div className="flex gap-2">
        {uncategorizedCount > 0 && (
          <Link
            href="/transactions/review"
            className="btn-secondary text-sm px-3 py-1.5"
          >
            {DROP_COPY.bannerReviewCta}
          </Link>
        )}
        {duplicatesCount > 0 && (
          <Link
            href="/transactions/duplicates"
            className="btn-secondary text-sm px-3 py-1.5"
          >
            {DROP_COPY.bannerDuplicatesCta}
          </Link>
        )}
      </div>
    </div>
  );
}
