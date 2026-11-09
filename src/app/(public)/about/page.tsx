import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "Kompleet: About Us",
  description:
    "Kompleet is simple bookkeeping for Nigerian small businesses. Import bank statements, track spending, send invoices and export clean financial reports.",
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
            Kompleet is bookkeeping and invoicing software for Nigerian small
            and medium enterprises. Import statements from 11 local banks,
            track spending, send invoices, and export P&amp;L and balance
            sheets.
          </p>
          <p className="leading-relaxed text-text-2">
            Record invoice payments when customers settle, so your books stay
            current.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-8">
            <h2 className="font-display mb-3 text-2xl font-semibold">
              Why Nigeria
            </h2>
            <p className="leading-relaxed text-text-2">
              Naira amounts, local bank statement formats, and the way Nigerian
              businesses invoice are built into the product.
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
            Start with your books
          </h3>
          <p className="mb-4 text-text-2">
            Create an account and import a statement.
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
