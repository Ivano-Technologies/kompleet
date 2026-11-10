import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { CompanyLegalLinks } from "@/components/legal/CompanyLegalLinks";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
  title: "Kompleet: Pricing",
  description: "Kompleet pricing.",
};

const lifetimeIncluded = [
  "All current features",
  "One payment, no monthly or annual fees",
  "Lifetime access for one named user",
  "Future improvements to the core features",
];

const PLAN_CARD =
  "flex h-full flex-col rounded-xl border border-border bg-surface p-8 shadow-1 dark:border-dark-border dark:bg-dark-surface";

function PlanFeatureList({ features }: { features: readonly string[] }) {
  return (
    <ul className="mb-8 space-y-4">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary dark:text-accent" />
          <span className="text-sm text-text-2 dark:text-dark-text-2">
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <div
      data-marketing
      className="flex min-h-screen flex-col bg-bg text-text-1 dark:bg-dark-bg dark:text-dark-text-1"
    >
      <LandingNav />

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-6 py-16 sm:px-12">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h1 className="font-display mb-4 text-4xl font-bold md:text-5xl">
            Pricing
          </h1>
          <p className="mx-auto max-w-2xl text-base text-text-2 dark:text-dark-text-2">
            Access is through a one-off founding payment. The price is shown at
            checkout.
          </p>
        </div>

        <div className="mx-auto mb-12 max-w-md">
          <div data-plan="lifetime" className={PLAN_CARD}>
            <div className="text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-2 dark:border-dark-border dark:bg-dark-surface-2 dark:text-dark-text-2">
                Founding users
              </span>
              <h2 className="font-display mb-2 text-3xl font-bold sm:text-4xl">
                Lifetime access
              </h2>
              <p className="mb-8 text-sm text-text-2 dark:text-dark-text-2">
                One-off founding payment. The price is shown at checkout.
              </p>
            </div>

            <PlanFeatureList features={lifetimeIncluded} />

            <Link
              href="/signup"
              className="mt-auto flex min-h-11 items-center justify-center rounded-md bg-primary-fill py-3.5 text-center text-sm font-bold text-white hover:bg-primary-fill-hover focus-visible:ring-2 focus-visible:ring-link disabled:opacity-50"
            >
              Get started
            </Link>
            <p className="mt-4 text-center text-sm text-text-2 dark:text-dark-text-2">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-8 text-center dark:border-dark-border dark:bg-dark-surface">
          <h3 className="font-display mb-3 text-xl font-bold">Later access</h3>
          <p className="text-sm leading-relaxed text-text-2 dark:text-dark-text-2">
            A one-off lifetime plan is coming soon. We will email testers
            before charging anyone. No price is published yet.
          </p>
          <div className="mt-6">
            <CompanyLegalLinks />
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
