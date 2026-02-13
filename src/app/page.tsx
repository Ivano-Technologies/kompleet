import Link from 'next/link';
import Image from 'next/image';
import HeroButtons from '@/components/landing/HeroButtons';

export default function Home() {
  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                <span className="material-icons text-white">account_balance_wallet</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white uppercase">Kompleet</span>
            </div>
            <div className="hidden md:flex gap-8 items-center h-full">
              <Link className="text-sm font-medium hover:text-primary transition-colors py-2" href="#features">Features</Link>
              <Link className="text-sm font-medium hover:text-primary transition-colors py-2" href="#compliance">Compliance</Link>
              <Link className="text-sm font-medium hover:text-primary transition-colors py-2" href="/pricing">Pricing</Link>
              <Link className="text-sm font-medium hover:text-primary transition-colors py-2" href="#resources">Resources</Link>
              <Link
                href="/signup"
                className="btn-primary px-6 py-2.5 rounded text-sm"
                aria-label="Get started with Kompleet"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 hero-glow -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Trusted by 5,000+ Nigerian SMEs
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              Tax Compliance &amp; Financial Management for <span className="text-primary">Bold SMEs.</span>
            </h1>
            <p className="text-lg lg:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Automate your FIRS and LIRS filings, manage professional invoices, and gain real-time insights into your business growth—all in one secure platform.
            </p>
            <HeroButtons />
          </div>

          {/* Hero Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent rounded-xl blur-lg"></div>
            <div className="relative rounded-xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl p-6">
              {/* Mock Dashboard UI */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-4 text-xs text-slate-500 font-mono">dashboard.kompleet.app</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/60 rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Revenue (MTD)</p>
                  <p className="text-xl font-bold text-white">&#x20A6;4,250,000</p>
                  <p className="text-xs text-green-400 mt-1">+12.5% vs last month</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Tax Obligations</p>
                  <p className="text-xl font-bold text-white">&#x20A6;637,500</p>
                  <p className="text-xs text-primary mt-1">VAT + WHT calculated</p>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Outstanding Invoices</p>
                  <p className="text-xl font-bold text-white">12</p>
                  <p className="text-xs text-yellow-400 mt-1">3 overdue</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/60 rounded-lg p-4 border border-white/5 h-32 flex flex-col">
                  <p className="text-xs text-slate-500 mb-2">Cashflow Trend</p>
                  <div className="flex-1 flex items-end gap-1">
                    {[40, 65, 45, 80, 60, 90, 75, 95, 85, 70, 88, 92].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/40 rounded-t" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-4 border border-white/5 h-32">
                  <p className="text-xs text-slate-500 mb-2">Compliance Status</p>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">FIRS Filing</span>
                      <span className="text-green-400 font-medium">Up to date</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">LIRS Filing</span>
                      <span className="text-green-400 font-medium">Up to date</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">PAYE Returns</span>
                      <span className="text-yellow-400 font-medium">Due in 5 days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="compliance" className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
            Compliant with the leading institutions
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2">
              <span className="material-icons text-3xl">account_balance</span>
              <span className="font-bold text-xl">FIRS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-icons text-3xl">gavel</span>
              <span className="font-bold text-xl">LIRS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-icons text-3xl">security</span>
              <span className="font-bold text-xl">NDPR</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-icons text-3xl">verified_user</span>
              <span className="font-bold text-xl">CAC</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight">
                Effortless Compliance for the <span className="text-primary">Nigerian Market.</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                We&apos;ve built KOMPLEET from the ground up to handle the unique regulatory landscape of Nigeria. No more manual calculations or missed deadlines.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary mt-1 flex-shrink-0">check_circle</span>
                  <div>
                    <h4 className="font-bold">Automated VAT &amp; WHT</h4>
                    <p className="text-sm text-slate-500">Auto-calculate and generate reports for value-added and withholding taxes.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary mt-1 flex-shrink-0">check_circle</span>
                  <div>
                    <h4 className="font-bold">Direct Filing Integration</h4>
                    <p className="text-sm text-slate-500">Streamlined process to submit directly to FIRS and LIRS portals.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary mt-1 flex-shrink-0">check_circle</span>
                  <div>
                    <h4 className="font-bold">Multi-Currency Invoicing</h4>
                    <p className="text-sm text-slate-500">Bill clients in Naira or USD with real-time exchange rates.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="glass-card p-8 rounded-xl flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-icons text-primary">receipt_long</span>
                </div>
                <h3 className="font-bold mb-2">Smart Invoices</h3>
                <p className="text-xs text-slate-500">Send professional invoices in seconds.</p>
              </div>
              <div className="glass-card p-8 rounded-xl flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-icons text-primary">insights</span>
                </div>
                <h3 className="font-bold mb-2">Cashflow Radar</h3>
                <p className="text-xs text-slate-500">Real-time visibility into your runway.</p>
              </div>
              <div className="glass-card p-8 rounded-xl flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-icons text-primary">assignment_turned_in</span>
                </div>
                <h3 className="font-bold mb-2">Tax Reminders</h3>
                <p className="text-xs text-slate-500">Never miss a filing deadline again.</p>
              </div>
              <div className="glass-card p-8 rounded-xl flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-icons text-primary">groups</span>
                </div>
                <h3 className="font-bold mb-2">Payroll Sync</h3>
                <p className="text-xs text-slate-500">Automate PAYE and pensions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary mb-2">&#x20A6;2.5B+</div>
              <p className="text-sm font-medium text-slate-500">Processed Monthly</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary mb-2">100%</div>
              <p className="text-sm font-medium text-slate-500">Compliance Rate</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary mb-2">5,000+</div>
              <p className="text-sm font-medium text-slate-500">Active Businesses</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-primary mb-2">24/7</div>
              <p className="text-sm font-medium text-slate-500">Priority Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-12 rounded-xl border-l-4 border-l-primary relative">
            <span className="material-icons text-6xl text-primary/20 absolute top-8 right-8">format_quote</span>
            <div className="max-w-3xl">
              <p className="text-2xl font-medium mb-8 leading-relaxed">
                &ldquo;KOMPLEET has completely transformed how we handle taxes at our agency. What used to take days of manual spreadsheet work now happens automatically. It&apos;s the first financial tool I&apos;ve used that actually understands the Nigerian context.&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800">
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBv4rOlvEPPq2ML4L6RcNsp9Wk9_ReScHnS8vXDD0ackyu3SE5doR7kxm7jfsVq-_CjZ231ROTCHHxnIG2uY7NYxVXdbw0Ac2ekHzftongeQAhmCgGkJQf7vjUhV8eMyicHsPfI45eNsR3u7xOfUJZ7kP3otC2rp2WBfTK6PmRw_-KPRWwZAjCAXQ-gcq3WteKdU_upUmZh60f4XjwLx3iqPYu4qvt-JZ63jFzSwvTlSJywvfiEBGWYclV61LyPW7Y4Y_maRKpXkYIZ"
                    alt="Chioma Adebayo"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h5 className="font-bold">Chioma Adebayo</h5>
                  <p className="text-sm text-slate-500">CEO, Lagos Creative Hub</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-xl p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-extrabold text-white mb-8">
                Ready to automate your <br />business finances?
              </h2>
              <p className="text-white/80 text-lg mb-12 max-w-xl mx-auto">
                Join the new era of financial management. Compliant, efficient, and built for growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="btn-white px-8 py-4 rounded-lg text-lg"
                  aria-label="Create a free Kompleet account"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/contact"
                  className="btn-ghost px-8 py-4 rounded-lg text-lg"
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
      <footer className="bg-white/[0.02] border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="sm:col-span-2 md:col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                  <span className="material-icons text-white text-sm">account_balance_wallet</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-white uppercase">Kompleet</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs mb-8">
                The definitive financial operating system for modern Nigerian businesses. Registered and compliant with national standards.
              </p>
              <div className="flex gap-4">
                <a className="text-slate-500 hover:text-primary transition-colors" href="#" aria-label="Follow us on Facebook">
                  <span className="material-icons">facebook</span>
                </a>
                <a className="text-slate-500 hover:text-primary transition-colors" href="#" aria-label="Follow us on Twitter">
                  <span className="material-icons">alternate_email</span>
                </a>
                <a className="text-slate-500 hover:text-primary transition-colors" href="#" aria-label="Share Kompleet">
                  <span className="material-icons">share</span>
                </a>
              </div>
            </div>
            <div>
              <h6 className="font-bold text-sm uppercase tracking-widest mb-6">Product</h6>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link className="hover:text-primary" href="/calculators">Tax Automation</Link></li>
                <li><Link className="hover:text-primary" href="/invoices">Invoicing</Link></li>
                <li><Link className="hover:text-primary" href="/dashboard">Cashflow Analytics</Link></li>
                <li><Link className="hover:text-primary" href="/dashboard">Payroll</Link></li>
              </ul>
            </div>
            <div>
              <h6 className="font-bold text-sm uppercase tracking-widest mb-6">Company</h6>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link className="hover:text-primary" href="/about">About Us</Link></li>
                <li><Link className="hover:text-primary" href="/compliance">Compliance</Link></li>
                <li><Link className="hover:text-primary" href="/careers">Careers</Link></li>
                <li><Link className="hover:text-primary" href="/press">Press</Link></li>
              </ul>
            </div>
            <div>
              <h6 className="font-bold text-sm uppercase tracking-widest mb-6">Support</h6>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link className="hover:text-primary" href="/help">Help Center</Link></li>
                <li><Link className="hover:text-primary" href="/contact">Contact Us</Link></li>
                <li><Link className="hover:text-primary" href="/api-docs">Developer API</Link></li>
                <li><Link className="hover:text-primary" href="/legal">Legal</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500">&copy; 2026 KOMPLEET Financial. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-slate-500">
              <Link className="hover:text-white" href="/privacy">Privacy Policy</Link>
              <Link className="hover:text-white" href="/terms">Terms of Service</Link>
              <Link className="hover:text-white" href="/cookies">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
