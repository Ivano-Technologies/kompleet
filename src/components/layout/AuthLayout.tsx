"use client";

import Image from "next/image";
import Link from "next/link";

type AuthLayoutProps = {
  children: React.ReactNode;
  variant?: "dark-split";
  /** Kept for callers; illustration is an SVG and does not use next/image priority. */
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
    <div data-marketing className="flex min-h-screen w-full bg-bg">
      <div className="relative hidden overflow-hidden bg-primary-deep md:block md:w-1/2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/illustrations/auth-panel.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>

      <div className="flex w-full items-center justify-center p-6 md:w-1/2 md:p-8">
        <main className="w-full max-w-[440px] rounded-xl border border-border bg-surface p-8 shadow-1 md:p-12">
          <div className="mb-6 flex justify-center">
            <Link href="/">
              <Image
                src="/assets/logo-primary.png"
                alt="Kompleet"
                width={40}
                height={40}
                className="rounded-lg"
              />
            </Link>
          </div>

          {(headerLeftAddon || headerRightAddon) && (
            <div className="mb-4 flex items-center justify-between gap-4 text-sm">
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
