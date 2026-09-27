import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | KOMPLEET",
  description:
    "KOMPLEET is free during beta. See what is included today and what we will price later.",
};

const included = [
  "Bank statement import for 11 Nigerian banks",
  "VAT calculator under Nigeria Tax Act 2025",
  "Filing-ready NRS and LIRS form generation",
  "Invoicing with NRS-compliant QR codes",
  "P&L and balance sheet reports",
  "Transaction categorization",
  "Email support during beta",
];

export default function PricingPage() {
  return (
    <div
      data-marketing
      className="flex min-h-screen flex-col bg-bg text-text-1"
    >
      <LandingNav />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 sm:px-12">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h1 className="font-display mb-4 text-4xl font-bold md:text-5xl">
            Free during beta
          </h1>
          <p className="mx-auto max-w-2xl text-base text-text-2">
            Every live feature is included while we are in beta. No card, no
            seat limits announced.
          </p>
        </div>

        <div className="mx-auto mb-12 max-w-lg rounded-xl border border-border bg-surface p-8 shadow-1">
          <div className="text-center">
            <span className="mb-4 inline-flex items-center rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-2">
              Beta access
            </span>
            <h2 className="font-display mb-2 text-4xl font-bold">₦0</h2>
            <p className="mb-8 text-sm text-text-2">
              Full access to what ships today
            </p>
          </div>

          <ul className="mb-8 space-y-4">
            {included.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-text-2">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="block rounded-md bg-accent py-3.5 text-center text-sm font-bold text-charcoal hover:bg-accent-hover"
          >
            Get started
          </Link>
        </div>

        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-8 text-center">
          <h3 className="font-display mb-3 text-xl font-bold">After beta</h3>
          <p className="text-sm leading-relaxed text-text-2">
            We will publish paid tiers for Nigerian SMEs before charging anyone.
            Beta accounts keep access through that notice period. Early testers
            get a stated discount — we will email it, not bury it.
          </p>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
