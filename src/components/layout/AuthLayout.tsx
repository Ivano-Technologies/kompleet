"use client";

import { BrandWordmark } from "@/components/brand/BrandWordmark";

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
    <div data-marketing className="flex min-h-dvh w-full bg-bg">
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
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </picture>
      </div>

      <div className="flex w-full items-center justify-center p-5 md:w-1/2 md:p-4 lg:p-5">
        <main className="w-full max-w-[400px] rounded-xl border border-border bg-surface px-5 py-5 shadow-1 md:max-w-[420px] md:px-6 md:py-5">
          <div className="mb-3 flex justify-center">
            <BrandWordmark href="/" size="md" />
          </div>

          {(headerLeftAddon || headerRightAddon) && (
            <div className="mb-3 flex items-center justify-between gap-3 text-xs">
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
