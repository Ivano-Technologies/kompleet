import Image from "next/image";
import Link from "next/link";
import { Landmark, Zap, FileUp, BarChart3, TrendingUp, Lock } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const HERO_GRID_PATTERN =
  "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2248%22%20height=%2248%22%20viewBox=%220%200%2048%2048%22%3E%3Cpath%20fill=%22rgba(255,255,255,0.03)%22%20d=%22M0%201h48v-1H0zm0%2047h48v-1H0zM1%200v48H0V0zm47%200v48h-1V0z%22/%3E%3C/svg%3E";

const trustBarItems = [
  "11 Nigerian bank parsers",
  "Nigeria Tax Act 2025 engine",
  "NRS-compliant invoice QR",
];

const featuredCards = [
  {
    icon: Zap,
    title: "VAT Calculator",
    desc: "Calculate value-added tax under the Nigeria Tax Act 2025 — standard, zero-rated, and exempt treatments.",
  },
  {
    icon: FileUp,
    title: "Filing-Ready Forms",
    desc: "Generate NRS and LIRS filing packages as downloadable forms you submit yourself. No portal auto-filing.",
  },
  {
    icon: BarChart3,
    title: "P&L and Balance Sheet",
    desc: "Profit & loss and balance sheet reports generated from your books — ready to share with an accountant.",
  },
];

const features = [
  {
    icon: Landmark,
    title: "Bank Statement Import",
    desc: "Upload statements from 11 Nigerian banks. Parsers extract transactions and validate running balances so imports stay trustworthy.",
    image: "/assets/features/expense-tracking.png",
  },
  {
    icon: FileUp,
    title: "Professional Invoicing",
    desc: "Create and track invoices with NRS-compliant QR codes for e-invoicing. Record payment when your customer settles — checkout integrations are not live yet.",
    image: "/assets/features/invoicing.png",
  },
  {
    icon: Landmark,
    title: "Tax Compliance Centre",
    desc: "Run VAT, CIT, and related calculations against the Nigeria Tax Act 2025 engine. Export filing-ready packages for NRS and LIRS.",
    image: null,
  },
  {
    icon: TrendingUp,
    title: "Business Reports",
    desc: "Profit & loss and balance sheet reports generated from your recorded activity. Share with your accountant or investors.",
    image: null,
  },
  {
    icon: Lock,
    title: "Bank-Grade Security",
    desc: "Financial data is protected with encryption in transit and at rest, with NDPR-minded access controls. Hosted on Supabase in the EU (Ireland).",
    image: null,
  },
];

export default function HomePage() {
  return (
    <div className="bg-bg dark:bg-dark-bg text-text-1 dark:text-dark-text-1">
      <LandingNav />

      {/* Hero Section */}
      <header className="bg-gradient-to-br from-primary-deep via-primary to-primary-mid text-white py-24 px-6 md:px-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{ backgroundImage: `url("${HERO_GRID_PATTERN}")` }}
        />
        <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/25 rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs font-bold text-accent uppercase tracking-widest">
                Built for Nigerian <span className="normal-case">SMEs</span>
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
              Control Your Money.
              <br />
              <em className="text-accent not-italic">Grow Your Business.</em>
            </h1>
            <p className="text-base text-white/60 max-w-md">
              Import Nigerian bank statements, run the Nigeria Tax Act 2025
              engine, issue NRS-ready invoices, and export P&amp;L and balance
              sheets.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Link
                href="/signup"
                className="bg-accent text-charcoal border-none px-7 py-3.5 rounded-md text-sm font-bold shadow-accent hover:bg-accent-hover transition-all transform hover:-translate-y-1"
              >
                Get Started for Free →
              </Link>
              <a
                href="#features"
                className="bg-white/10 text-white border-2 border-white/20 px-6 py-3 rounded-md text-sm font-semibold hover:bg-white/20 hover:border-white/40 transition-all"
              >
                See Features
              </a>
            </div>
            <div className="flex flex-wrap gap-5 pt-6 text-xs text-white/50 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="text-accent">✓</span> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-accent">✓</span> NDPR Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-accent">✓</span> Free during Beta
              </span>
            </div>
          </div>
          {/* Hero image — natural edges, no frame */}
          <div className="relative rounded-2xl shadow-2xl">
            <Image
              src="/assets/hero-laptop.webp"
              alt="Kompleet Dashboard Preview"
              width={644}
              height={483}
              className="w-full h-auto rounded-2xl"
              priority
            />
          </div>
        </div>
      </header>

      {/* Trust Bar */}
      <div className="bg-charcoal-dk py-4 px-6 md:px-12 flex items-center justify-center gap-6 md:gap-10 flex-wrap">
        {trustBarItems.map((item) => (
          <div
            key={item}
            className="flex items-center gap-2 text-xs font-bold text-white/50 uppercase tracking-widest"
          >
            <span className="w-1 h-1 rounded-full bg-accent" />
            {item}
          </div>
        ))}
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 md:px-12">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-primary dark:text-accent uppercase tracking-widest mb-3">
            What ships today
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-1 dark:text-dark-text-1 leading-tight tracking-tighter">
            Real Nigerian finance tooling
            <br />
            — not a feature wish list
          </h2>
          <p className="text-base text-text-3 dark:text-dark-text-3 max-w-xl mx-auto mt-4">
            Statement parsers with balance validation, the Nigeria Tax Act 2025
            engine, invoicing with NRS-compliant QR codes, and financial
            statements you can export.
          </p>
        </div>

        {/* TOP ROW: 2 large photo cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {features
            .filter((f) => f.image)
            .map((f) => (
              <div
                key={f.title}
                className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl overflow-hidden shadow-1 hover:shadow-3 hover:-translate-y-1 hover:border-accent/40 transition-all relative group flex flex-col"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-surface-2 dark:bg-dark-surface-2">
                  <Image
                    src={f.image!}
                    alt={f.title}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-bold text-text-1 dark:text-dark-text-1 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-text-3 dark:text-dark-text-3 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
        </div>

        {/* MIDDLE ROW: 3 featured cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {featuredCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl shadow-outer-soft border-t border-l border-black/5 dark:border-white/5 p-6 flex flex-col hover:shadow-3 hover:-translate-y-1 hover:border-accent/40 transition-all relative group overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center mb-4 shadow-primary">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display text-lg font-bold text-text-1 dark:text-dark-text-1 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-text-3 dark:text-dark-text-3 leading-relaxed flex-1">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* BOTTOM ROW: remaining feature cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {features
            .filter((f) => !f.image)
            .map((f) => (
              <div
                key={f.title}
                className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl overflow-hidden shadow-1 hover:shadow-3 hover:-translate-y-1 hover:border-accent/40 transition-all relative group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-6">
                  <div className="w-11 h-11 rounded-lg bg-primary flex items-center justify-center mb-4 shadow-primary">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-text-1 dark:text-dark-text-1 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-text-3 dark:text-dark-text-3 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Final CTA — no fabricated social proof */}
      <section className="bg-gradient-to-br from-primary-deep to-primary py-24 px-6 md:px-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 text-[280px] md:text-[320px] font-bold font-display text-white/5 leading-none flex items-center justify-center pointer-events-none">
          ₦
        </div>
        <div className="relative z-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight tracking-tighter">
            Ready to Take Control of
            <br />
            Your <em className="text-accent not-italic">Business Finances?</em>
          </h2>
          <p className="text-base text-white/60 max-w-md mx-auto mt-4 mb-8">
            Free during Beta — no credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-accent text-charcoal border-none px-8 py-4 rounded-md text-base font-bold shadow-accent hover:bg-accent-hover transition-all transform hover:-translate-y-1"
          >
            Get Started for Free →
          </Link>
        </div>
      </section>
      <LandingFooter />
    </div>
  );
}
