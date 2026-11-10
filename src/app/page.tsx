import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import HeroAuthCard from "@/components/landing/HeroAuthCard";
import Link from "next/link";
import type { Metadata } from "next";
import { kompleetJsonLd, serializeJsonLd } from "@/lib/seo/jsonLd";

// Title, description and og tags come from the root layout unchanged.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div data-marketing className="bg-bg text-text-1 dark:bg-dark-bg dark:text-dark-text-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(kompleetJsonLd()) }}
      />
      <LandingNav heroAuth />

      <main id="main-content">
      <section aria-labelledby="landing-hero-heading">
        <div className="grid lg:h-[calc(100svh-4rem)] lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)]">
          <div className="flex flex-col justify-center bg-bg px-6 py-6 sm:px-10 lg:px-12 lg:py-8 xl:px-16 dark:bg-dark-bg">
            <div className="mx-auto w-full max-w-lg space-y-4">
              <h1
                id="landing-hero-heading"
                className="font-display text-[32px] font-bold leading-[1.15] tracking-tight lg:text-[36px] xl:text-[40px]"
              >
                Control Your Money.
                <br />
                Grow Your Business.
              </h1>
              <p className="max-w-md text-sm text-text-2">
                Nigerian bank imports, simple invoicing and clean financial reports.
              </p>
              <HeroAuthCard />
            </div>
          </div>
          <div className="relative min-h-[180px] overflow-hidden bg-primary-deep sm:min-h-[220px] lg:min-h-0">
            <picture>
              <source
                srcSet="/assets/illustrations/hero-kompleet.svg"
                type="image/svg+xml"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/illustrations/hero-kompleet.png"
                alt="Geometric illustration of stacked ledger books with a naira mark and teal verified seal"
                width={1440}
                height={720}
                className="absolute inset-0 h-full w-full object-cover object-[center_28%]"
              />
            </picture>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-12 md:pt-20">
        <div className="mx-auto max-w-7xl">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/assets/illustrations/bookkeeping-flow-mobile.svg"
              type="image/svg+xml"
              width={684}
              height={740}
            />
            <source
              srcSet="/assets/illustrations/bookkeeping-flow.svg"
              type="image/svg+xml"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/illustrations/bookkeeping-flow.png"
              alt="Bookkeeping flow from bank import to sorted expenses, an invoice and a monthly report"
              width={1440}
              height={480}
              className="h-auto w-full rounded-xl border border-border dark:border-dark-border"
            />
          </picture>
          <p className="mt-6 text-center text-sm text-text-2">
            From imported statements to clean financial reports you can share.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary-deep px-6 py-24 text-center md:px-12">
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-display text-[32px] font-bold leading-tight tracking-tight text-white md:text-4xl">
            Ready to take control of your business finances?
          </h2>
          <Link
            href="/signup"
            className="mt-8 inline-flex min-h-11 items-center rounded-md bg-accent-hover px-8 py-4 text-base font-bold text-charcoal hover:bg-[#115E59]"
          >
            Get started
          </Link>
        </div>
      </section>
      </main>
      <LandingFooter />
    </div>
  );
}
