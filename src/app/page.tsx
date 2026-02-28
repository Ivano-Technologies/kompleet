import Image from "next/image";
import Link from "next/link";
import { Landmark } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const HERO_GRID_PATTERN =
  "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2248%22%20height=%2248%22%20viewBox=%220%200%2048%2048%22%3E%3Cpath%20fill=%22rgba(255,255,255,0.03)%22%20d=%22M0%201h48v-1H0zm0%2047h48v-1H0zM1%200v48H0V0zm47%200v48h-1V0z%22/%3E%3C/svg%3E";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Contact", href: "/contact" },
];

const trustBarItems = [
  "Mobile-First Design",
  "Real-Time Expense Tracking",
  "Instant Invoicing",
  "NDPR Compliant",
  "256-bit SSL",
  "Nigerian Data Residency",
  "CAC Integrated",
  "Free During Beta",
];

const features = [
  {
    icon: "📊",
    title: "Smart Expense Tracking",
    desc: "Automatically categorise every naira spent. Connect your bank account and watch your expenses organise themselves in real time.",
    image: "/assets/features/expense-tracking.png",
  },
  {
    icon: "📄",
    title: "Professional Invoicing",
    desc: "Create, send, and track invoices in seconds. Accept payments via bank transfer, Paystack, or Flutterwave.",
    image: "/assets/features/invoicing.png",
  },
  {
    icon: "landmark",
    title: "Tax Compliance Centre",
    desc: "Never miss an NRS or JTB deadline again. Kompleet tracks your VAT, WHT, CIT, and PAYE obligations automatically — with smart reminders before every filing date.",
    image: null,
  },
  {
    icon: "📈",
    title: "Business Reports",
    desc: "Profit & loss, cash flow, and balance sheet reports generated automatically. Share with your accountant or investors.",
    image: null,
  },
  {
    icon: "🔒",
    title: "Bank-Grade Security",
    desc: "Your financial data is protected with 256-bit encryption and full NDPR compliance. Your data stays in Nigeria.",
    image: null,
  },

];

const testimonials = [
  {
    name: "Adebayo Ogunlesi",
    role: "CEO, TechVentures Lagos",
    text: "Kompleet has completely transformed how we handle our finances. The tax compliance alerts alone have saved us from two potential NRS penalties.",
  },
  {
    name: "Chioma Nwosu",
    role: "Founder, GreenField Agritech",
    text: "As a growing agritech startup, keeping track of expenses across multiple states was a nightmare. Kompleet made it simple.",
  },
  {
    name: "Emeka Okafor",
    role: "Partner, Okafor & Associates",
    text: "I've tried every accounting tool. None of them understood Nigerian tax law the way Kompleet does. The VAT filing feature is accurate and fast.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-bg text-text-1">
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
                Built for Nigerian Business
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight tracking-tighter">
              Control Your Money.
              <br />
              <em className="text-accent not-italic">Grow Your Business.</em>
            </h1>
            <p className="text-base text-white/60 max-w-md">
              Track your spending, handle invoices, and avoid surprises.
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
                Watch Demo
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
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <Image
              src="/assets/hero-laptop.webp"
              alt="Kompleet Dashboard Preview"
              width={644}
              height={355}
              className="w-full h-auto object-cover"
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
            Core Features
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-1 dark:text-dark-text-1 leading-tight tracking-tighter">
            Everything Your Business Needs
            <br />
            to Stay Financially Healthy
          </h2>
          <p className="text-base text-text-3 dark:text-dark-text-3 max-w-xl mx-auto mt-4">
            From daily expense tracking to annual tax filing — Kompleet handles
            the financial complexity so you can focus on growth.
          </p>
        </div>
        {/* Top row: 2 large image cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {features.filter(f => f.image).map((f) => (
            <div
              key={f.title}
              className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg overflow-hidden shadow-1 hover:shadow-3 hover:-translate-y-1 transition-all relative group flex flex-col h-full"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-full h-56 overflow-hidden">
                <Image
                  src={f.image!}
                  alt={f.title}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-8">
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
        {/* Bottom row: 3 icon-only cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {features.filter(f => !f.image).map((f) => (
            <div
              key={f.title}
              className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border rounded-lg overflow-hidden shadow-1 hover:shadow-3 hover:-translate-y-1 transition-all relative group"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-8">
                <div className="w-11 h-11 rounded-md bg-primary flex items-center justify-center text-xl mb-5 shadow-primary">
                  {f.icon === 'landmark' ? <Landmark className="w-5 h-5 text-white" /> : f.icon}
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

      {/* Testimonials */}
      <section className="bg-surface-2 dark:bg-dark-surface py-24 px-6 md:px-12">
        <div className="text-center mb-12">
          <div className="text-xs font-bold text-primary dark:text-accent uppercase tracking-widest mb-3">
            Trusted by Nigerian Businesses
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-text-1 dark:text-dark-text-1">
            What Our Users Are Saying
          </h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-surface dark:bg-dark-surface-2 border border-border dark:border-dark-border rounded-lg p-8 shadow-1"
            >
              <div className="text-accent text-sm mb-4">★★★★★</div>
              <p className="text-sm text-text-2 dark:text-dark-text-2 leading-relaxed italic mb-6">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-display text-sm font-bold text-accent">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-bold text-text-1 dark:text-dark-text-1">
                    {t.name}
                  </div>
                  <div className="text-xs text-text-4 dark:text-dark-text-4 mt-0.5">
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
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
            Join 5,000+ Nigerian businesses already using Kompleet. Free during
            Beta — no credit card required.
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
