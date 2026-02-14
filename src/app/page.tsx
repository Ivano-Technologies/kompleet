import {
  ArrowRight,
  BarChart3,
  Bell,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  Shield,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import AnimatedSection from '@/components/landing/AnimatedSection';

const HERO_DASHBOARD =
  'https://private-us-east-1.manuscdn.com/sessionFile/FHlfXyMgxU2Pt2Bnt6svnm/sandbox/luUcO3vrTWrHIzYBS4i6AR-img-1_1771075989000_na1fn_aGVyby1kYXNoYm9hcmQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRkhsZlh5TWd4VTJQdDJCbnQ2c3ZubS9zYW5kYm94L2x1VWNPM3ZyVFdySEl6WUJTNGk2QVItaW1nLTFfMTc3MTA3NTk4OTAwMF9uYTFmbl9hR1Z5Ynkxa1lYTm9ZbTloY21RLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Ii9l86B~9b5BPrKcE7Mc7~qGmVeWpSSgK5cd-JwFGo9hg3H6nbwEE1iUzL4EOw4m6sYc0GdJ~lJOmRJ411PNGxqOlhbqxV-yHjB6REgShThfFOG4Z~0ZJqEuD7HmmLdzVb8Cnb5HDIvnz2a5Vr2nZssz-rwQHs9L8MZ5vnm8nnV3R2UEHnc0zWm4XSYP~lr~REGzhKFMCkJj~lBISfEXxygB2pR98hKJtBMeV34FKh5UfWSbdm~rZjc-YyQYI-BkJgjT~R7bupsjyxuWVEy-W3jtiMht-N2oEVRUtYnzGmjzZp-YXvNwIEG2hJNSghzVZUcyQRQnJDRs-0THgsgqgg__';
const FEATURE_TAX =
  'https://private-us-east-1.manuscdn.com/sessionFile/FHlfXyMgxU2Pt2Bnt6svnm/sandbox/luUcO3vrTWrHIzYBS4i6AR-img-3_1771075982000_na1fn_ZmVhdHVyZS10YXg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRkhsZlh5TWd4VTJQdDJCbnQ2c3ZubS9zYW5kYm94L2x1VWNPM3ZyVFdySEl6WUJTNGk2QVItaW1nLTNfMTc3MTA3NTk4MjAwMF9uYTFmbl9abVZoZEhWeVpTMTBZWGcucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=rog3coLl1hZ~ZeODiJJ6uYDqrsJBBFa7enH-zY91mAqcAAORWjt5K9ZQFUNTyGNUOlUqXKEeVdnP8qPsKjm3-A~-HT~PtiW3~dXiGINYH7uNadkq~pFg3yItYqipxVNTX589iU0gSoPCy9MXY6hG-hr-iOraARrk0CgC8rP-vc3EM7PQ9E~LSlOatPulC-~sxzym-FcH~8OVFHw~eCGvpjmUBpYF7EK1uGlDB~CJpZnP-PX3ew~9iQxbC5r3yuJNsUyOj-mrQhEjtTs-f5yolEfFmPBWD84BCtRBxUarINmWbt43cyWa2MZtolv2FGZKlmHsvtpJOLeQFBQEYECUbg__';
const FEATURE_INVOICE =
  'https://private-us-east-1.manuscdn.com/sessionFile/FHlfXyMgxU2Pt2Bnt6svnm/sandbox/luUcO3vrTWrHIzYBS4i6AR-img-4_1771075989000_na1fn_ZmVhdHVyZS1pbnZvaWNl.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRkhsZlh5TWd4VTJQdDJCbnQ2c3ZubS9zYW5kYm94L2x1VWNPM3ZyVFdySEl6WUJTNGk2QVItaW1nLTRfMTc3MTA3NTk4OTAwMF9uYTFmbl9abVZoZEhWeVpTMXBiblp2YVdObC5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=KPcrSgrJ4Hlsb7QwhAwQnBz1QjEU7zUHj6k0frx7Vw6FGKtCKgQFLbc-Avaah3x3SzsD14yQVPs4gVn9F5CptslUSgdF73oX00HJWdyH02C-QXy4YWVRxqQhRko4hC5J52D1jzD8OxFipOqxvRa9WiW2ibbhTKJiilm-lmawsMchWAM4-U8HYuPn0Ct1Iuo1q0TvYnaYJ2zsv7-HNzsvumOHc5QBUwO~mi-NNj7Go8tm4IFLiZPW1MWAs8kKE5PGCvEtmZooTO~z1wWjd1DQe5lhXw391MnduVxFjxdSADZbOCAI74B-dTkC5w-Prs1yXbngB9dB4rGIVcJNeZGAEQ__';
const FEATURE_ANALYTICS =
  'https://private-us-east-1.manuscdn.com/sessionFile/FHlfXyMgxU2Pt2Bnt6svnm/sandbox/luUcO3vrTWrHIzYBS4i6AR-img-5_1771075983000_na1fn_ZmVhdHVyZS1hbmFseXRpY3M.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvRkhsZlh5TWd4VTJQdDJCbnQ2c3ZubS9zYW5kYm94L2x1VWNPM3ZyVFdySEl6WUJTNGk2QVItaW1nLTVfMTc3MTA3NTk4MzAwMF9uYTFmbl9abVZoZEhWeVpTMWhibUZzZVhScFkzTS5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Bp9deiyIQL0PC1TCDt7L-INU1HMMhgknbkr8kfvUML525syXfMsrpkYhsC5hcHzvIAm8PP0s5go6AxfoVAzsINW-y7ulbcc~Cj8Bf-nwd-vRI5OEBiquOGA1NIiqkUWDeAJkmehHovwUUlO5B3qxPOrkNuYnfSKU-cInNv7rr9aROrx8OkRva5vz0wm2GXU1yjDI60LNpXsRWc7BVRA0wSZkB-1N2itUe3RGanQpyintqmLJ7GVMNtR-TQbdoK5F0ru8zIrs51hSgVR-uYpSqcXTqerYHFMO8Kj8P4E0ZWEaATho2wm0rYuRyyZJ9YNWe7XzpGEk5zWFXcxGAG5sOw__';

const features = [
  { icon: Zap, title: 'Automated VAT & WHT', desc: 'Auto-calculate and generate reports for value-added and withholding taxes under the 2025 Nigeria Tax Act.' },
  { icon: FileText, title: 'Direct Filing', desc: 'Streamlined process to submit directly to FIRS and LIRS portals with pre-filled forms.' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Gain visibility into revenue, expenses, and tax obligations with interactive dashboards.' },
  { icon: Clock, title: 'Smart Reminders', desc: 'Never miss a filing deadline with automated notifications and compliance calendar.' },
  { icon: Globe, title: 'Multi-Currency', desc: 'Bill clients in Naira or USD with real-time CBN exchange rates and automatic conversion.' },
  { icon: Calculator, title: 'Tax Calculators', desc: 'Built-in calculators for VAT, WHT, stamp duty, capital allowances, and property tax.' },
  { icon: Shield, title: 'Bank-Grade Security', desc: 'End-to-end encryption, SOC 2 compliance, and role-based access controls.' },
  { icon: Bell, title: 'Notifications', desc: 'Real-time alerts for invoice payments, tax deadlines, and account activity.' },
  { icon: FileText, title: 'Professional Invoicing', desc: 'Send branded invoices in seconds with automatic payment tracking and reminders.' },
];

const stats = [
  { value: '₦2.5B+', label: 'Processed Monthly' },
  { value: '100%', label: 'Compliance Rate' },
  { value: '5,000+', label: 'Active Businesses' },
  { value: '24/7', label: 'Priority Support' },
];

const steps = [
  { step: '01', title: 'Connect Your Accounts', desc: 'Link your bank accounts and import transactions automatically. We support all major Nigerian banks.' },
  { step: '02', title: 'Categorize & Calculate', desc: 'Our ML engine auto-categorizes transactions and calculates your tax obligations in real-time.' },
  { step: '03', title: 'File & Report', desc: 'Generate compliant reports and file directly to FIRS/LIRS. Download professional financial statements.' },
];

const testimonials = [
  { quote: 'KOMPLEET saved us 20 hours per month on tax calculations. The automated VAT filing alone is worth the subscription.', name: 'Adebayo Ogunlesi', role: 'CEO, TechVentures Lagos' },
  { quote: 'Finally, a platform that understands Nigerian tax law. The 2025 Tax Act compliance features are exactly what we needed.', name: 'Chioma Nwosu', role: 'CFO, GreenField Agritech' },
  { quote: 'The invoicing system is professional and the multi-currency support makes billing international clients seamless.', name: 'Emeka Okafor', role: 'Founder, Okafor & Associates' },
];

const compliance = [
  { name: 'FIRS', desc: 'Federal Inland Revenue Service' },
  { name: 'LIRS', desc: 'Lagos Internal Revenue Service' },
  { name: 'NDPR', desc: 'Nigeria Data Protection Regulation' },
  { name: 'CAC', desc: 'Corporate Affairs Commission' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))]">
      <LandingNav />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-glow -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 md:pt-24 md:pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Copy */}
            <AnimatedSection className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(var(--primary-rgb),0.1)] border border-[rgba(var(--primary-rgb),0.2)] text-[rgb(var(--primary))] text-xs font-semibold tracking-wide uppercase">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--primary))] opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[rgb(var(--primary))]" />
                </span>
                Trusted by 5,000+ Nigerian SMEs
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1]">
                Tax Compliance &{' '}
                <span className="text-[rgb(var(--primary))]">Financial Management</span>{' '}
                Made Simple
              </h1>

              <p className="text-lg text-[rgb(var(--text-secondary))] max-w-lg leading-relaxed">
                Automate FIRS and LIRS filings, send professional invoices, and gain real-time insights into your business growth — all in one secure platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/signup"
                  className="btn-primary btn-with-icon px-6 py-3 rounded-lg text-base font-semibold"
                >
                  Start for Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="btn-secondary px-6 py-3 rounded-lg text-base font-semibold text-center"
                >
                  Watch Demo
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4 text-sm text-[rgb(var(--text-secondary))]">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[rgb(var(--primary))]" /> No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[rgb(var(--primary))]" /> 14-day free trial
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[rgb(var(--primary))]" /> Cancel anytime
                </span>
              </div>
            </AnimatedSection>

            {/* Right: Dashboard preview */}
            <AnimatedSection direction="right" delay={0.3} className="relative">
              <div className="rounded-xl overflow-hidden shadow-2xl border border-[rgb(var(--border))]">
                <Image
                  src={HERO_DASHBOARD}
                  alt="KOMPLEET Dashboard"
                  width={800}
                  height={500}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[rgba(var(--primary-rgb),0.1)] rounded-full blur-2xl" />
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-[rgba(var(--primary-rgb),0.05)] rounded-full blur-3xl" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="border-y border-[rgb(var(--border))] bg-[rgb(var(--surface))] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[rgb(var(--primary))]">{stat.value}</div>
                <div className="text-sm text-[rgb(var(--text-secondary))] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─── */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-[rgb(var(--primary))] uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything Your Business Needs</h2>
            <p className="text-[rgb(var(--text-secondary))] text-lg">
              From automated tax calculations to professional invoicing — manage your entire financial workflow in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <AnimatedSection key={i} delay={i * 0.05}>
                  <div className="group p-6 rounded-lg border border-[rgb(var(--border))] hover:border-[rgba(var(--primary-rgb),0.4)] hover:shadow-sm transition-all duration-200 h-full">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(var(--primary-rgb),0.1)] flex items-center justify-center mb-4 group-hover:bg-[rgba(var(--primary-rgb),0.15)] transition-colors">
                      <Icon className="w-5 h-5 text-[rgb(var(--primary))]" />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                    <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">{f.desc}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURE SHOWCASE (alternating) ─── */}
      <section className="py-20 md:py-28 bg-[rgb(var(--surface))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          {/* Tax Compliance */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection direction="left" className="space-y-5">
              <p className="text-sm font-semibold text-[rgb(var(--primary))] uppercase tracking-wider">Tax Compliance</p>
              <h3 className="text-3xl font-bold">Automated Tax Filing for Nigerian Businesses</h3>
              <p className="text-[rgb(var(--text-secondary))] leading-relaxed">
                KOMPLEET automatically calculates your VAT, WHT, and CIT obligations based on the 2025 Nigeria Tax Act. Generate FIRS-compliant reports and file directly from the platform.
              </p>
              <ul className="space-y-3">
                {['Auto-calculate VAT at 7.5%', 'Withholding tax deduction tracking', 'FIRS & LIRS direct filing integration', 'Audit-ready compliance reports'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[rgb(var(--primary))] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-secondary btn-with-icon px-4 py-2 rounded-lg text-sm font-semibold inline-flex mt-2">
                Learn More <ChevronRight className="w-4 h-4" />
              </Link>
            </AnimatedSection>
            <AnimatedSection direction="right">
              <Image src={FEATURE_TAX} alt="Tax compliance" width={500} height={400} className="w-full max-w-md mx-auto" />
            </AnimatedSection>
          </div>

          {/* Invoicing */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection direction="left" className="order-2 lg:order-1">
              <Image src={FEATURE_INVOICE} alt="Professional invoicing" width={500} height={400} className="w-full max-w-md mx-auto" />
            </AnimatedSection>
            <AnimatedSection direction="right" className="space-y-5 order-1 lg:order-2">
              <p className="text-sm font-semibold text-[rgb(var(--primary))] uppercase tracking-wider">Invoicing</p>
              <h3 className="text-3xl font-bold">Professional Invoices in Seconds</h3>
              <p className="text-[rgb(var(--text-secondary))] leading-relaxed">
                Create, send, and track branded invoices with automatic payment reminders. Support for Naira and USD with real-time exchange rates.
              </p>
              <ul className="space-y-3">
                {['Branded invoice templates', 'Automatic payment tracking', 'Multi-currency support (NGN/USD)', 'Recurring invoice automation'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[rgb(var(--primary))] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-secondary btn-with-icon px-4 py-2 rounded-lg text-sm font-semibold inline-flex mt-2">
                Learn More <ChevronRight className="w-4 h-4" />
              </Link>
            </AnimatedSection>
          </div>

          {/* Analytics */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection direction="left" className="space-y-5">
              <p className="text-sm font-semibold text-[rgb(var(--primary))] uppercase tracking-wider">Analytics</p>
              <h3 className="text-3xl font-bold">Real-Time Financial Insights</h3>
              <p className="text-[rgb(var(--text-secondary))] leading-relaxed">
                Interactive dashboards give you instant visibility into your business performance. Track revenue, expenses, and profitability trends with year-over-year comparisons.
              </p>
              <ul className="space-y-3">
                {['Revenue & expense tracking', 'Profit & loss statements', 'Year-over-year comparison', 'Exportable financial reports'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[rgb(var(--primary))] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-secondary btn-with-icon px-4 py-2 rounded-lg text-sm font-semibold inline-flex mt-2">
                Learn More <ChevronRight className="w-4 h-4" />
              </Link>
            </AnimatedSection>
            <AnimatedSection direction="right">
              <Image src={FEATURE_ANALYTICS} alt="Financial analytics" width={500} height={400} className="w-full max-w-md mx-auto" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-[rgb(var(--primary))] uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Started in Minutes</h2>
            <p className="text-[rgb(var(--text-secondary))] text-lg">Three simple steps to automate your financial management.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <AnimatedSection key={i} delay={i * 0.15}>
                <div className="relative p-8 rounded-lg border border-[rgb(var(--border))] solid-card h-full">
                  <span className="text-5xl font-bold text-[rgba(var(--primary-rgb),0.1)] absolute top-4 right-6">{s.step}</span>
                  <div className="w-10 h-10 rounded-full bg-[rgb(var(--primary))] text-white flex items-center justify-center text-sm font-bold mb-5">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">{s.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPLIANCE ─── */}
      <section id="compliance" className="py-20 md:py-28 bg-[rgb(var(--surface))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-[rgb(var(--primary))] uppercase tracking-wider mb-3">Compliance</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Nigerian Regulatory Standards</h2>
            <p className="text-[rgb(var(--text-secondary))] text-lg">
              KOMPLEET is designed from the ground up to comply with Nigerian tax laws and financial regulations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {compliance.map((org) => (
              <div key={org.name} className="flex flex-col items-center justify-center p-6 rounded-lg border border-[rgb(var(--border))] solid-card hover:border-[rgba(var(--primary-rgb),0.4)] transition-colors text-center">
                <span className="text-xl font-bold text-[rgb(var(--primary))] mb-1">{org.name}</span>
                <span className="text-xs text-[rgb(var(--text-secondary))]">{org.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-sm font-semibold text-[rgb(var(--primary))] uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold">Trusted by Business Owners</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="p-6 rounded-lg border border-[rgb(var(--border))] solid-card h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-[rgb(var(--text-secondary))]">{t.role}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 md:py-28 bg-[rgb(var(--primary))] text-white">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Automate Your Business Finances?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of Nigerian businesses already saving time and staying compliant with KOMPLEET.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="btn-white btn-with-icon px-6 py-3 rounded-lg text-base font-semibold"
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-lg text-base font-semibold text-center transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
