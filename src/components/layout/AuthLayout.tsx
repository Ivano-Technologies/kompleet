"use client";

import Image from "next/image";
import Link from "next/link";
import AuthPanelArt from "@/components/landing/AuthPanelArt";

type AuthLayoutProps = {
  children: React.ReactNode;
  variant?: "dark-split";
  /** Kept for callers; the panel is inline SVG. */
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
      <div className="relative hidden md:flex md:w-1/2 md:items-center md:justify-center overflow-hidden bg-gradient-to-b from-primary-deep to-primary p-10">
        <AuthPanelArt className="h-auto w-full max-h-[85vh]" />
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
                priority
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
