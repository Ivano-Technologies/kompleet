"use client";

import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import type { StatementUploadResult } from "./StatementDropZone";
import { DROP_COPY } from "./statement-copy";

export function ImportToast({
  result,
  onDismiss,
  viewBooksHref = "/transactions",
  onFixReview,
}: {
  result: StatementUploadResult;
  onDismiss: () => void;
  viewBooksHref?: string;
  onFixReview?: () => void;
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
            {result.pendingReview > 0 &&
              (onFixReview ? (
                <button
                  type="button"
                  onClick={onFixReview}
                  className="text-primary font-medium"
                >
                  {DROP_COPY.toastReview(result.pendingReview)}
                </button>
              ) : (
                <Link
                  href="/transactions?triage=open"
                  className="text-primary font-medium"
                >
                  {DROP_COPY.toastReview(result.pendingReview)}
                </Link>
              ))}
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
  needsCheckCount,
  uncategorizedCount,
  duplicatesCount,
  onReview,
}: {
  needsCheckCount?: number;
  uncategorizedCount?: number;
  duplicatesCount: number;
  onReview?: () => void;
}) {
  const reviewCount = needsCheckCount ?? uncategorizedCount ?? 0;
  if (reviewCount <= 0 && duplicatesCount <= 0) return null;

  const openReview = () => {
    if (onReview) {
      onReview();
      return;
    }
    window.location.href = "/transactions?triage=open";
  };

  return (
    <div className="space-y-2">
      {reviewCount > 0 ? (
        <button
          type="button"
          onClick={openReview}
          className="flex w-full items-center justify-between gap-4 rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-left"
          style={{ borderLeftWidth: 4, borderLeftColor: "#D97706" }}
        >
          <span className="flex items-center gap-3">
            <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-warning" />
            <span className="text-sm font-semibold text-text-1">
              {DROP_COPY.bannerReview(reviewCount)}
            </span>
          </span>
          <span className="rounded-[10px] border border-border bg-surface px-4 py-2 text-sm font-semibold text-primary">
            {DROP_COPY.bannerReviewCta}
          </span>
        </button>
      ) : null}
      {duplicatesCount > 0 ? (
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-sm text-text-2">
            {DROP_COPY.bannerDuplicates(duplicatesCount)}
          </p>
          <Link
            href="/transactions/duplicates"
            className="text-sm font-medium text-primary"
          >
            {DROP_COPY.bannerDuplicatesCta}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
