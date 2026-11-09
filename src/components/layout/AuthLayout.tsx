"use client";

import { SkipToContent } from "@/components/a11y/SkipToContent";
import { BrandLockup } from "@/components/brand/BrandLockup";

type AuthLayoutProps = {
  children: React.ReactNode;
  variant?: "dark-split";
  imagePriority?: boolean;
  headerLeftAddon?: React.ReactNode;
  headerRightAddon?: React.ReactNode;
};

export function AuthLayout({
  children,
  variant = "dark-split",
  headerLeftAddon,
  headerRightAddon,
}: AuthLayoutProps) {
  if (variant !== "dark-split") {
    return null;
  }

  return (
    <div data-marketing className="flex min-h-dvh w-full bg-bg dark:bg-dark-bg">
      <SkipToContent />
      <div className="relative hidden min-h-dvh overflow-hidden bg-primary-deep md:block md:w-1/2">
        <picture>
          <source
            srcSet="/assets/illustrations/auth-panel.svg"
            type="image/svg+xml"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/illustrations/auth-panel.png"
            alt=""
            role="presentation"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </picture>
      </div>

      <div className="flex w-full items-center justify-center px-4 py-4 md:w-1/2 md:px-6 md:py-5">
        <main
          id="main-content"
          className="w-full max-w-[440px] rounded-xl border border-border bg-surface p-5 shadow-1 md:p-6 dark:border-dark-border dark:bg-dark-surface"
        >
          <div className="mb-3 flex justify-center">
            <BrandLockup
              href="/"
              size="md"
              tone="auto"
              markHeight={20}
              linkClassName="min-h-11 -my-2.5"
            />
          </div>

          {(headerLeftAddon || headerRightAddon) && (
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <div>{headerLeftAddon}</div>
              <div>{headerRightAddon}</div>
            </div>
          )}

          <div>{children}</div>
        </main>
      </div>
    </div>
  );
}
