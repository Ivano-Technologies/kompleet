"use client";

import Link from "next/link";
import { useState } from "react";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { HERO_AUTH_ID, requestHeroAuth } from "@/components/landing/hero-auth";
import { useTheme } from "@/contexts/ThemeContext";
import { Menu, Moon, Sun, X } from "lucide-react";

const ACCENT_CTA =
  "rounded-md bg-accent-hover text-sm font-bold text-charcoal hover:bg-[#115E59]";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

type LandingNavProps = {
  /** Homepage: Sign in focuses the hero form; Get started is omitted. */
  heroAuth?: boolean;
};

export default function LandingNav({ heroAuth = false }: LandingNavProps) {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const signInHref = heroAuth ? `#${HERO_AUTH_ID}` : "/login";

  const handleSignInClick = () => {
    setMobileMenuOpen(false);
    if (heroAuth) {
      requestHeroAuth("signin");
    }
  };

  const themeLabel =
    theme === "light" ? "Switch to dark mode" : "Switch to light mode";

  return (
    <>
      <SkipToContent />
      <nav
        className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md"
        aria-label="Primary"
      >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLockup href="/" size="lg" linkClassName="min-h-11" />

        <div className="hidden flex-1 items-center justify-end gap-5 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center text-sm font-medium text-text-2 transition-colors hover:text-text-1"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border hover:bg-surface"
            aria-label={themeLabel}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 text-text-2" />
            ) : (
              <Sun className="h-4 w-4 text-dark-text-2" />
            )}
          </button>
          <Link
            href={signInHref}
            onClick={handleSignInClick}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-text-1 transition-colors hover:text-primary"
          >
            Sign in
          </Link>
          {heroAuth ? null : (
            <Link
              href="/signup"
              className={`${ACCENT_CTA} inline-flex min-h-11 items-center px-4`}
            >
              Get started
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="landing-mobile-nav"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          id="landing-mobile-nav"
          className="space-y-3 border-t border-border bg-bg px-4 py-4 md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center text-sm font-medium text-text-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border hover:bg-surface"
            aria-label={themeLabel}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {theme === "light" ? "Dark mode" : "Light mode"}
            </span>
          </button>
          <div className="flex gap-2 pt-2">
            <Link
              href={signInHref}
              onClick={handleSignInClick}
              className="flex min-h-11 flex-1 items-center justify-center px-4 text-center text-sm font-semibold text-text-1"
            >
              Sign in
            </Link>
            {heroAuth ? null : (
              <Link
                href="/signup"
                className={`${ACCENT_CTA} flex min-h-11 flex-1 items-center justify-center px-4 text-center`}
              >
                Get started
              </Link>
            )}
          </div>
        </div>
      )}
      </nav>
    </>
  );
}
