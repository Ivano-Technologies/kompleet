import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import ProductChrome from "@/components/landing/ProductChrome";

const trustBarItems = [
  "11 bank parsers",
  "Tax Act 2025",
  "NRS invoice QR",
];

const productProof = [
  {
    src: "/assets/illustrations/import-flow.svg",
    title: "Import",
    caption: "Statements from 11 Nigerian banks, with running-balance checks.",
  },
  {
    src: "/assets/illustrations/invoice-nrs.svg",
    title: "Invoice",
    caption: "NRS-ready invoices with an abstract QR block you can issue today.",
  },
];

const capabilities = [
  {
    icon: "/assets/illustrations/spot-banks.svg",
    title: "11 Nigerian bank parsers",
    desc: "Upload statements. Parsers extract transactions and validate running balances.",
  },
  {
    icon: "/assets/illustrations/spot-invoice.svg",
    title: "NRS invoicing",
    desc: "Create invoices with NRS-compliant QR codes. Record payment when the customer settles.",
  },
  {
    icon: "/assets/illustrations/spot-vat.svg",
    title: "VAT under Tax Act 2025",
    desc: "Standard, zero-rated, and exempt treatments against the current engine.",
  },
  {
    icon: "/assets/illustrations/spot-filing.svg",
    title: "NRS / LIRS packages",
    desc: "Generate filing-ready forms you submit on the official portals. No auto-filing.",
  },
  {
    icon: "/assets/illustrations/spot-reports.svg",
    title: "P&L and balance sheet",
    desc: "Reports from your books — ready to share with an accountant.",
  },
  {
    icon: "/assets/illustrations/spot-security.svg",
    title: "NDPR-minded hosting",
    desc: "Encrypted in transit and at rest. Hosted on Convex. We do not claim Nigerian data residency.",
  },
];

export default function HomePage() {
  return (
    <div data-marketing className="bg-bg text-text-1">
      <LandingNav />

      <header className="px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-text-2">
                Built for Nigerian <span className="normal-case">SMEs</span>
              </span>
            </div>
            <h1 className="font-display text-[40px] font-bold leading-tight tracking-tight md:text-5xl">
              Control Your Money.
              <br />
              Grow Your Business.
            </h1>
            <p className="max-w-md text-base text-text-2">
              Import Nigerian bank statements, run the Nigeria Tax Act 2025
              engine, issue NRS-ready invoices, and export P&amp;L and balance
              sheets.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/signup"
                className="rounded-md bg-accent px-7 py-3.5 text-sm font-bold text-charcoal hover:bg-accent-hover"
              >
                Get started
              </Link>
              <a
                href="#features"
                className="rounded-md border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-1"
              >
                See features
              </a>
            </div>
            <p className="pt-2 text-xs font-medium text-text-3">
              Free during beta. No credit card required.
            </p>
          </div>
          <ProductChrome variant="dashboard" />
        </div>
      </header>

      <div className="bg-charcoal-dk px-6 py-4 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 md:gap-10">
          {trustBarItems.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70"
            >
              <span className="h-1 w-1 rounded-full bg-white/40" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <section className="px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto mb-12 max-w-7xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
            Product proof
          </p>
          <h2 className="font-display text-[32px] font-bold tracking-tight md:text-4xl">
            Real tooling, labeled demo data
          </h2>
        </div>
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          {productProof.map((item) => (
            <figure
              key={item.title}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                width={1200}
                height={670}
                className="h-auto w-full"
              />
              <figcaption className="p-5">
                <h3 className="font-display text-lg font-bold text-text-1">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-3">
                  {item.caption}
                </p>
              </figcaption>
            </figure>
          ))}
          <figure className="overflow-hidden rounded-xl border border-border bg-surface">
            <ProductChrome variant="tax" />
            <figcaption className="p-5">
              <h3 className="font-display text-lg font-bold text-text-1">
                Tax centre
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-3">
                VAT, CIT, and filing packages you download and submit yourself.
              </p>
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="features" className="px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto mb-12 max-w-7xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">
            What ships today
          </p>
          <h2 className="font-display text-[32px] font-bold tracking-tight md:text-4xl">
            Capability, not a wish list
          </h2>
        </div>
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => (
            <article
              key={item.title}
              id={item.title === "NDPR-minded hosting" ? "security" : undefined}
              className="rounded-xl border border-border bg-surface p-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.icon} alt="" width={44} height={44} className="mb-4" />
              <h3 className="font-display text-xl font-bold text-text-1">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-3">
                {item.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/illustrations/tax-filing-flow.svg"
            alt=""
            width={1440}
            height={480}
            className="h-auto w-full rounded-xl border border-border"
          />
          <p className="mt-6 text-center text-sm text-text-2">
            From books to NRS/LIRS packages you submit yourself.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary-deep px-6 py-24 text-center md:px-12">
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-display text-[32px] font-bold leading-tight tracking-tight text-white md:text-4xl">
            Ready to take control of your business finances?
          </h2>
          <p className="mx-auto mt-4 mb-8 max-w-md text-base text-white/70">
            Free during beta — no credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-md bg-accent px-8 py-4 text-base font-bold text-charcoal hover:bg-accent-hover"
          >
            Get started
          </Link>
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
