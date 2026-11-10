"use client";

import { useSearchParams } from "next/navigation";

/** SHA overlay so Coco shots are stamped with the commit under review. */
export function ThemeShotStamp() {
  const sha = useSearchParams().get("sha");
  if (!sha) return null;

  return (
    <div
      data-theme-shot-sha={sha}
      className="pointer-events-none fixed bottom-2 right-2 z-[100] rounded bg-dark-surface px-2 py-1 font-mono text-[10px] text-dark-text-2 ring-1 ring-white/10"
    >
      {sha}
    </div>
  );
}
