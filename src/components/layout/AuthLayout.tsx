"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

type AuthLayoutProps = {
  children: React.ReactNode;
  /** Enable priority loading for background image (login page only) */
  imagePriority?: boolean;
  /** Optional content rendered after logo on the left (e.g. Back to Login link) */
  headerLeftAddon?: React.ReactNode;
  /** Optional content rendered before Features link on the right (e.g. Already have account?) */
  headerRightAddon?: React.ReactNode;
};

export function AuthLayout({
  children,
  imagePriority = false,
  headerLeftAddon,
  headerRightAddon,
}: AuthLayoutProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Background image — 16:9 integrity with object-cover, no file modification */}
      <Image
        src="/assets/auth-lifestyle.jpg"
        alt="Entrepreneur reviewing finances with KOMPLEET"
        fill
        priority={imagePriority}
        className="object-cover"
        sizes="100vw"
      />

      {/* Desktop overlay — right 50% only, refined gradient with soft fade at center */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 md:block"
        style={{
          backgroundImage:
            "linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)",
        }}
      />

      {/* Mobile overlay — full screen 40% */}
      <div className="pointer-events-none absolute inset-0 bg-black/40 md:hidden" />

      {/* Content layer */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 pt-6 md:px-10 md:pt-8 lg:px-16">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Kompleet Logo"
                width={40}
                height={40}
                className="rounded-lg shadow-4"
              />
              <span className="font-ceoruse text-xl font-bold text-white drop-shadow-sm">
                KOMPLEET
              </span>
            </Link>
            {headerLeftAddon}
          </div>
          <div className="flex items-center gap-3">
            {headerRightAddon}
            <Link
              href="/#features"
              className="text-xs font-medium text-white/90 drop-shadow-sm hover:text-white"
            >
              Features
            </Link>
            <Link
              href="/contact"
              className="text-xs font-medium text-white/90 drop-shadow-sm hover:text-white"
            >
              Contact
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md border border-white/20 bg-black/20 p-2 text-white/90 drop-shadow-sm hover:bg-black/40 hover:text-white"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center overflow-x-hidden px-6 pb-10 pt-8 md:px-10 md:pb-16 md:pt-0 lg:px-16">
          <div className="flex w-full max-w-full justify-center md:justify-end">
            <div
              className="mr-0 w-full max-w-md rounded-2xl bg-surface/95 p-6 text-text-1 shadow-[0_25px_60px_rgba(0,0,0,0.35)] backdrop-blur md:mr-8 md:p-8 lg:mr-16 lg:p-10 xl:mr-24 dark:bg-dark-bg/95 dark:text-dark-text-1"
              style={{ minHeight: 0 }}
            >
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
