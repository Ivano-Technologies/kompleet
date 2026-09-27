"use client";

import { SETUP_COPY } from "./setup-copy";

export function SetupSoftBanner({
  onSetup,
  onDismiss,
}: {
  onSetup: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-info-bg border border-[#BFDBFE] rounded-lg px-4 py-3"
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-primary">{SETUP_COPY.bannerTitle}</p>
        <p className="text-xs text-text-2 mt-0.5">{SETUP_COPY.bannerSub}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onSetup}
          className="text-xs font-semibold text-primary bg-surface border border-border rounded-md px-3 py-2"
        >
          {SETUP_COPY.bannerCta}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium text-text-3 px-2 py-2 hover:text-text-2"
        >
          {SETUP_COPY.bannerDismiss}
        </button>
      </div>
    </div>
  );
}
