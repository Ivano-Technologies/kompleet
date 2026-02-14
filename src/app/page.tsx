import { Wallet, ArrowRight, Landmark, Gavel, Shield, ShieldCheck, CheckCircle, Receipt, TrendingUp, ClipboardCheck, Users, Quote, Facebook, Mail, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import HeroButtons from '@/components/landing/HeroButtons';

export default function Home() {
  return (
    <>
      {/* Navigation - Solid Design */}
      <nav className="fixed top-0 w-full z-50 solid-nav backdrop-blur-sm bg-white/95 dark:bg-dark-surface/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary uppercase">Kompleet</span>
            </div>
            <div className="hidden md:flex gap-8 items-center h-full">
              <Link className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors py-2" href="#features">Features</Link>
              <Link className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors py-2" href="#compliance">Compliance</Link>
              <Link className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors py-2" href="/pricing">Pricing</Link>
              <Link className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors py-2" href="#resources">Resources</Link>
              <Link
                href="/signup"
                className="btn-primary"
                aria-label="Get started with Kompleet"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white dark:bg-dark-background">
        <div className="absolute inset-0 hero-glow -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-200 dark:border-primary-500/20 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Trusted by 5,000+ Nigerian SMEs
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-light-text-primary dark:text-dark-text-primary">
              Tax Compliance &amp; Financial Management for <span className="text-primary-500">Bold SMEs.</span>
            </h1>
            <p className="text-lg lg:text-xl text-light-text-secondary dark:text-dark-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Automate your FIRS and LIRS filings, manage professional invoices, and gain real-time insights into your business growth—all in one secure platform.
            </p>
            {/* Fixed Button Alignment */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="btn-primary px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2 min-w-[200px] justify-center"
                aria-label="Start for free with Kompleet"
              >
                Start for Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                className="btn-ghost px-8 py-4 rounded-lg text-lg font-semibold border-2 border-light-border dark:border-dark-border hover:bg-light-surface dark:hover:bg-dark-surface min-w-[200px]"
                aria-label="Watch Kompleet demo video"
              >
                Watch Demo
              </button>
            </div>
          </div>

          {/* Hero Dashboard Preview - Solid Card */}
          <div className="mt-20 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/10 to-transparent rounded-xl"></div>
            <div className="relative solid-card bg-light-surface dark:bg-dark-surface overflow-hidden shadow-card-hover p-6">
              {/* Mock Dashboard UI */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-4 text-xs text-light-text-tertiary dark:text-dark-text-tertiary font-mono">dashboard.kompleet.app</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="solid-card bg-white dark:bg-dark-surface-hover p-4">
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">Revenue (MTD)</p>
                  <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">₦4,250,000</p>
                  <p className="text-xs text-success-light dark:text-success-dark mt-1">+12.5% vs last month</p>
                </div>
                <div className="solid-card bg-white dark:bg-dark-surface-hover p-4">
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">Tax Obligations</p>
                  <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">₦637,500</p>
                  <p className="text-xs text-primary-500 mt-1">VAT + WHT calculated</p>
                </div>
                <div className="solid-card bg-white dark:bg-dark-surface-hover p-4">
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-1">Outstanding Invoices</p>
                  <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">12</p>
                  <p className="text-xs text-warning-light dark:text-warning-dark mt-1">3 overdue</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="solid-card bg-white dark:bg-dark-surface-hover p-4 h-32 flex flex-col">
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-2">Cashflow Trend</p>
                  <div className="flex-1 flex items-end gap-1">
                    {[40, 65, 45, 80, 60, 90, 75, 95, 85, 70, 88, 92].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary-400/60 dark:bg-primary-500/40 rounded-t" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
                <div className="solid-card bg-white dark:bg-dark-surface-hover p-4 h-32">
                  <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mb-2">Compliance Status</p>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">FIRS Filing</span>
                      <span className="text-success-light dark:text-success-dark font-medium">Up to date</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">LIRS Filing</span>
                      <span className="text-success-light dark:text-success-dark font-medium">Up to date</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">PAYE Returns</span>
                      <span className="text-warning-light dark:text-warning-dark font-medium">Due in 5 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="compliance" className="py-12 border-y border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-light-text-tertiary dark:text-dark-text-tertiary mb-8">
            Compliant with the leading institutions
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 hover:opacity-100 transition-all">
            <div className="flex items-center gap-2">
              <Landmark className="w-8 h-8 text-light-text-primary dark:text-dark-text-primary" />
              <span className="font-bold text-xl text-light-text-primary dark:text-dark-text-primary">FIRS</span>
            </div>
            <div className="flex items-center gap-2">
              <Gavel className="w-8 h-8 text-light-text-primary dark:text-dark-text-primary" />
              <span className="font-bold text-xl text-light-text-primary dark:text-dark-text-primary">LIRS</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-light-text-primary dark:text-dark-text-primary" />
              <span className="font-bold text-xl text-light-text-primary dark:text-dark-text-primary">NDPR</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-light-text-primary dark:text-dark-text-primary" />
              <span className="font-bold text-xl text-light-text-primary dark:text-dark-text-primary">CAC</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Fixed Grid Alignment */}
      <section id="features" className="py-24 relative overflow-hidden bg-white dark:bg-dark-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start mb-24">
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight text-light-text-primary dark:text-dark-text-primary">
                Effortless Compliance for the <span className="text-primary-500">Nigerian Market.</span>
              </h2>
              <p className="text-light-text-secondary dark:text-dark-text-secondary text-lg mb-8 leading-relaxed">
                We&apos;ve built KOMPLEET from the ground up to handle the unique regulatory landscape of Nigeria. No more manual calculations or missed deadlines.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary">Automated VAT &amp; WHT</h4>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Auto-calculate and generate reports for value-added and withholding taxes.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary">Direct Filing Integration</h4>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Streamlined process to submit directly to FIRS and LIRS portals.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary">Multi-Currency Invoicing</h4>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Bill clients in Naira or USD with real-time exchange rates.</p>
                  </div>
                </li>
              </ul>
            </div>
            {/* Fixed Feature Cards Grid - Equal Heights */}
            <div className="grid grid-cols-2 gap-6 auto-rows-fr">
              <div className="solid-card p-6 rounded-xl flex flex-col items-center text-center hover-lift h-full">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-lg flex items-center justify-center mb-4 flex-shrink-0">
                  <Receipt className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="font-bold mb-2 text-light-text-primary dark:text-dark-text-primary text-base">Smart Invoices</h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Send professional invoices in seconds.</p>
              </div>
              <div className="solid-card p-6 rounded-xl flex flex-col items-center text-center hover-lift h-full">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-lg flex items-center justify-center mb-4 flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="font-bold mb-2 text-light-text-primary dark:text-dark-text-primary text-base">Cashflow Radar</h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Real-time visibility into your runway.</p>
              </div>
              <div className="solid-card p-6 rounded-xl flex flex-col items-center text-center hover-lift h-full">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-lg flex items-center justify-center mb-4 flex-shrink-0">
                  <ClipboardCheck className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="font-bold mb-2 text-light-text-primary dark:text-dark-text-primary text-base">Tax Reminders</h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Never miss a filing deadline again.</p>
              </div>
              <div className="solid-card p-6 rounded-xl flex flex-col items-center text-center hover-lift h-full">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 rounded-lg flex items-center justify-center mb-4 flex-shrink-0">
                  <Users className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="font-bold mb-2 text-light-text-primary dark:text-dark-text-primary text-base">Payroll Sync</h3>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Automate PAYE and pensions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary-50 dark:bg-primary-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary-500 mb-2">₦2.5B+</div>
              <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Processed Monthly</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary-500 mb-2">100%</div>
              <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Compliance Rate</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary-500 mb-2">5,000+</div>
              <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Active Businesses</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary-500 mb-2">24/7</div>
              <p className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Priority Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 bg-white dark:bg-dark-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="solid-card p-12 rounded-xl border-l-4 border-l-primary-500 relative">
            <Quote className="w-16 h-16 text-primary-500/20 absolute top-8 right-8" />
            <div className="max-w-3xl">
              <p className="text-2xl font-medium mb-8 leading-relaxed text-light-text-primary dark:text-dark-text-primary italic">
                &ldquo;KOMPLEET has completely transformed how we handle taxes at our agency. What used to take days of manual spreadsheet work now happens automatically. It&apos;s the first financial tool I&apos;ve used that actually understands the Nigerian context.&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-light-surface dark:bg-dark-surface">
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBv4rOlvEPPq2ML4L6RcNsp9Wk9_ReScHnS8vXDD0ackyu3SE5doR7kxm7jfsVq-_CjZ231ROTCHHxnIG2uY7NYxVXdbw0Ac2ekHzftongeQAhmCgGkJQf7vjUhV8eMyicHsPfI45eNsR3u7xOfUJZ7kP3otC2rp2WBfTK6PmRw_-KPRWwZAjCAXQ-gcq3WteKdU_upUmZh60f4XjwLx3iqPYu4qvt-JZ63jFzSwvTlSJywvfiEBGWYclV61LyPW7Y4Y_maRKpXkYIZ"
                    alt="Chioma Adebayo"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h5 className="font-bold text-light-text-primary dark:text-dark-text-primary">Chioma Adebayo</h5>
                  <p className="text-sm text-primary-500">CEO, Lagos Creative Hub</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Fixed Button Alignment */}
      <section className="py-24 bg-white dark:bg-dark-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-500 rounded-2xl p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
                Ready to automate your business finances?
              </h2>
              <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
                Join the new era of financial management. Compliant, efficient, and built for growth.
              </p>
              {/* Fixed Button Alignment */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/signup"
                  className="bg-white text-primary-500 hover:bg-gray-50 px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center justify-center min-w-[220px] transition-all"
                  aria-label="Create a free Kompleet account"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/contact"
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center justify-center min-w-[220px] transition-all"
                  aria-label="Contact Kompleet sales team"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary uppercase">Kompleet</span>
              </div>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                The definitive financial operating system for modern Nigerian businesses.
              </p>
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                Registered and compliant with national standards.
              </p>
              <div className="flex gap-4 mt-6">
                <a href="#" className="w-10 h-10 rounded-full bg-light-surface-hover dark:bg-dark-surface-hover flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all" aria-label="Facebook">
                  <Facebook className="w-[18px] h-[18px]" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-light-surface-hover dark:bg-dark-surface-hover flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all" aria-label="Email">
                  <Mail className="w-[18px] h-[18px]" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-light-surface-hover dark:bg-dark-surface-hover flex items-center justify-center hover:bg-primary-500 hover:text-white transition-all" aria-label="Share">
                  <Share2 className="w-[18px] h-[18px]" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-4 uppercase text-xs tracking-widest">Product</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">Tax Automation</Link></li>
                <li><Link href="#" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">Invoicing</Link></li>
                <li><Link href="#" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">Cashflow Analytics</Link></li>
                <li><Link href="#" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">Payroll</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-4 uppercase text-xs tracking-widest">Company</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">About Us</Link></li>
                <li><Link href="#" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">Compliance</Link></li>
                <li><Link href="#" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">Press</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-light-text-primary dark:text-dark-text-primary mb-4 uppercase text-xs tracking-widest">Support</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">Developer API</Link></li>
                <li><Link href="#" className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors">Legal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-light-border dark:border-dark-border pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                © 2024 KOMPLEET Financial. All rights reserved.
              </p>
              <div className="flex gap-6">
                <Link href="#" className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary hover:text-primary-500 transition-colors">Privacy Policy</Link>
                <Link href="#" className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary hover:text-primary-500 transition-colors">Terms of Service</Link>
                <Link href="#" className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary hover:text-primary-500 transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
