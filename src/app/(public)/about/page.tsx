import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "About Us | KOMPLEET",
  description:
    "KOMPLEET is financial tooling built for Nigerian SMEs — bank parsers, Tax Act 2025, and NRS invoices.",
};

export default function AboutPage() {
  return (
    <div data-marketing className="flex min-h-screen flex-col bg-bg text-text-1">
      <LandingNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
          About
        </p>
        <h1 className="font-display mb-6 text-4xl font-bold md:text-5xl">
          Built for Nigerian books
        </h1>
        <div className="space-y-6 rounded-xl border border-border bg-surface p-8">
          <p className="text-base leading-relaxed text-text-2">
            KOMPLEET is financial software for Nigerian small and medium
            enterprises. Import statements from 11 local banks, run the Nigeria
            Tax Act 2025 engine, issue NRS-ready invoices, and export P&amp;L
            and balance sheets.
          </p>
          <p className="leading-relaxed text-text-2">
            We do not auto-file to NRS or LIRS. You download filing-ready
            packages and submit them yourself. Checkout integrations are not
            live yet — invoice payment is recorded manually.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-8">
            <h2 className="font-display mb-3 text-2xl font-semibold">
              Why Nigeria
            </h2>
            <p className="leading-relaxed text-text-2">
              Naira, Tax Act 2025, NRS/LIRS, and local bank statement formats
              are the product — not a localisation layer on a generic ledger.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-8">
            <h2 className="font-display mb-3 text-2xl font-semibold">
              Built by
            </h2>
            <p className="font-semibold text-text-1">Ivano Technologies Ltd</p>
            <p className="mt-2 text-sm text-text-2">
              A technology company building tools for African businesses.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center">
          <h3 className="font-display mb-2 text-lg font-semibold">
            Free during beta
          </h3>
          <p className="mb-4 text-text-2">
            Create an account and import a statement. No invented user counts.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-md bg-accent px-6 py-3 text-sm font-bold text-charcoal hover:bg-accent-hover"
          >
            Get started
          </Link>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
