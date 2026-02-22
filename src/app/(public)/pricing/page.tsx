import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | KOMPLEET",
  description:
    "KOMPLEET is free during beta. Explore features included in the free plan.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline mb-8 inline-block"
        >
          &larr; Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary">
            KOMPLEET is currently free during our beta period.
          </p>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg shadow-sm border border-light-border dark:border-dark-border p-8 max-w-lg mx-auto mb-12">
          <div className="text-center">
            <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
              Beta Access
            </span>
            <h2 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
              Free
            </h2>
            <p className="text-light-text-tertiary dark:text-dark-text-tertiary mb-8">
              Full access to all features during beta
            </p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <span className="text-green-600 mt-0.5">&#10003;</span>
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                Automated VAT &amp; WHT calculations
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 mt-0.5">&#10003;</span>
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                FIRS &amp; LIRS filing preparation
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 mt-0.5">&#10003;</span>
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                Professional invoicing with multi-currency
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 mt-0.5">&#10003;</span>
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                Cashflow analytics &amp; reporting
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 mt-0.5">&#10003;</span>
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                Transaction categorization with AI
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 mt-0.5">&#10003;</span>
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                Tax deadline reminders
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-600 mt-0.5">&#10003;</span>
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                Priority email support
              </span>
            </li>
          </ul>

          <Link
            href="/signup"
            className="block w-full text-center bg-green-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-800 transition-colors"
          >
            Get Started for Free
          </Link>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
            Future Pricing
          </h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary max-w-xl mx-auto">
            After the beta period, we will introduce affordable pricing tiers
            designed for Nigerian SMEs. Early beta users will receive special
            pricing. Details will be announced ahead of any changes.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-light-border dark:border-dark-border">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
            &copy; 2026 Ivano Technologies Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
