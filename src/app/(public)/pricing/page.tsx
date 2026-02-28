import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | KOMPLEET",
  description:
    "KOMPLEET is free during beta. Explore features included in the free plan.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] flex flex-col">
      <LandingNav />

      <main className="flex-1 py-16 px-6 sm:px-12 md:px-24 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
            Pricing
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base text-[rgb(var(--text-secondary))] max-w-2xl mx-auto">
            KOMPLEET is currently free during our beta period.
          </p>
        </div>

        <div className="bg-[rgb(var(--surface))] rounded-lg shadow-1 border border-[rgb(var(--border))] p-8 max-w-lg mx-auto mb-12">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 bg-success/20 border border-success/30 rounded-full px-3 py-1 text-xs font-bold text-green-600 mb-4 uppercase tracking-wider">
              Beta Access
            </span>
            <h2 className="font-display text-4xl font-bold mb-2">
              Free
            </h2>
            <p className="text-sm text-[rgb(var(--text-secondary))] mb-8">
              Full access to all features during beta
            </p>
          </div>

          <ul className="space-y-4 mb-8">
            {[
              "Automated VAT & WHT calculations",
              "NRS & JTB filing preparation",
              "Professional invoicing with multi-currency",
              "Cashflow analytics & reporting",
              "Transaction categorization with AI",
              "Tax deadline reminders",
              "Priority email support"
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <span className="text-sm text-[rgb(var(--text-secondary))]">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/signup"
            className="block w-full text-center bg-primary text-white font-bold text-sm py-3.5 rounded-md shadow-primary hover:bg-primary-deep transition-all transform hover:-translate-y-0.5"
          >
            Start Free (14 days)
          </Link>
        </div>

        <div className="bg-[rgb(var(--surface))] rounded-lg shadow-1 border border-[rgb(var(--border))] p-8 text-center max-w-2xl mx-auto">
          <h3 className="font-display text-xl font-bold mb-3">
            Future Pricing
          </h3>
          <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
            After the beta period, we will introduce affordable pricing tiers
            designed for Nigerian SMEs. Early beta users will receive special
            pricing. Details will be announced ahead of any changes.
          </p>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
