import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function showingCount(
  count: number,
  singular: string,
  plural: string,
): string {
  return `Showing ${count} ${count === 1 ? singular : plural}`;
}

const pagerBtnClass =
  "inline-flex items-center justify-center min-h-11 min-w-11 rounded-md text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1 disabled:opacity-40 disabled:text-text-3 disabled:pointer-events-none disabled:hover:bg-transparent";

export function ListCardFooter({
  countLabel,
  children,
}: {
  countLabel: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-3 border-t border-border">
      <p className="text-sm text-text-3">{countLabel}</p>
      {children}
    </div>
  );
}

export function PageTurnButtons({
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
  pageLabel,
}: {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
  nextDisabled: boolean;
  pageLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Previous page"
        aria-disabled={prevDisabled}
        disabled={prevDisabled}
        className={pagerBtnClass}
        onClick={onPrev}
      >
        <ChevronLeft className="w-5 h-5" aria-hidden />
      </button>
      {pageLabel ? (
        <span className="px-3 py-1 text-xs font-medium bg-primary text-white rounded-md min-h-11 inline-flex items-center">
          {pageLabel}
        </span>
      ) : null}
      <button
        type="button"
        aria-label="Next page"
        aria-disabled={nextDisabled}
        disabled={nextDisabled}
        className={pagerBtnClass}
        onClick={onNext}
      >
        <ChevronRight className="w-5 h-5" aria-hidden />
      </button>
    </div>
  );
}

export function LoadMoreButton({
  loading,
  disabled,
  onClick,
}: {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const isDisabled = Boolean(disabled) || loading;
  return (
    <button
      type="button"
      className={cn(
        "btn-secondary w-full sm:w-auto min-h-11 text-sm px-4 inline-flex items-center justify-center gap-2",
        "disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-surface",
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      onClick={onClick}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          Loading…
        </>
      ) : (
        "Load more"
      )}
    </button>
  );
}
