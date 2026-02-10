import Link from 'next/link';

/**
 * KOMPLEET Landing Page - Stitch Redesign
 * 
 * Modern dark-themed landing page with glassmorphism effects
 * and Nigerian Green brand accents.
 * 
 * To use: Rename this file to page.tsx (backup the old one first)
 */
export default function Home() {
  return (
    <div className="dark min-h-screen bg-background-dark text-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
                <span className="material-icons text-white">account_balance_wallet</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white uppercase">
                Kompleet
              </span>
            </Link>
            
            <div className="hidden md:flex space-x-8 items-center">
              <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#compliance" className="text-sm font-medium hover:text-primary transition-colors">
                Compliance
              </Link>
              <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link href="#resources" className="text-sm font-medium hover:text-primary transition-colors">
                Resources
              </Link>
              <Link href="/signup">
                <button className="bg-primary hover:bg-opacity-90 text-white px-6 py-2.5 rounded font-semibold text-sm transition-all shadow-lg shadow-primary/20">
                  Get Started
                </button>
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
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Trusted by 5,000+ Nigerian SMEs
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              Tax Compliance & Financial Management for{' '}
              <span className="text-primary">Bold SMEs.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Automate your FIRS and LIRS filings, manage professional invoices, 
              and gain real-time insights into your business growth—all in one secure platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="bg-primary hover:bg-opacity-90 text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all hover-glow w-full sm:w-auto">
                  Start for Free
                  <span className="material-icons">arrow_forward</span>
                </button>
              </Link>
              <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-lg font-bold text-lg transition-all w-full sm:w-auto">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-transparent rounded-xl blur-lg"></div>
            <div className="relative rounded-xl border border-white/10 bg-slate-900 overflow-hidden shadow-2xl glass-card p-8">
              <div className="text-center text-slate-400">
                <p className="text-sm mb-4">Dashboard Preview</p>
                <div className="w-full h-96 bg-slate-800/50 rounded-lg flex items-center justify-center">
                  <span className="material-icons text-6xl text-primary/30">dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-12 border-y border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
            Compliant with the leading institutions
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 hover:opacity-100 transition-opacity">
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
            {/* Left: Text Content */}
            <div>
              <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight">
                Effortless Compliance for the{' '}
                <span className="text-primary">Nigerian Market.</span>
              </h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                We've built KOMPLEET from the ground up to handle the unique regulatory 
                landscape of Nigeria. No more manual calculations or missed deadlines.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary mt-1">check_circle</span>
                  <div>
                    <h4 className="font-bold">Automated VAT & WHT</h4>
                    <p className="text-sm text-slate-500">
                      Auto-calculate and generate reports for value-added and withholding taxes.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary mt-1">check_circle</span>
                  <div>
                    <h4 className="font-bold">Direct Filing Integration</h4>
                    <p className="text-sm text-slate-500">
                      Streamlined process to submit directly to FIRS and LIRS portals.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-icons text-primary mt-1">check_circle</span>
                  <div>
                    <h4 className="font-bold">Multi-Currency Invoicing</h4>
                    <p className="text-sm text-slate-500">
                      Bill clients in Naira or USD with real-time exchange rates.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right: Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-8 rounded-xl flex flex-col items-center text-center hover-lift">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-icons text-primary">receipt_long</span>
                </div>
                <h3 className="font-bold mb-2">Smart Invoices</h3>
                <p className="text-xs text-slate-500">Send professional invoices in seconds.</p>
              </div>
              
              <div className="glass-card p-8 rounded-xl flex flex-col items-center text-center hover-lift mt-8">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-icons text-primary">insights</span>
                </div>
                <h3 className="font-bold mb-2">Cashflow Radar</h3>
                <p className="text-xs text-slate-500">Real-time visibility into your runway.</p>
              </div>
              
              <div className="glass-card p-8 rounded-xl flex flex-col items-center text-center hover-lift">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-icons text-primary">assignment_turned_in</span>
                </div>
                <h3 className="font-bold mb-2">Tax Reminders</h3>
                <p className="text-xs text-slate-500">Never miss a filing deadline again.</p>
              </div>
              
              <div className="glass-card p-8 rounded-xl flex flex-col items-center text-center hover-lift mt-8">
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
      <section className="py-16 bg-white/2 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">₦2.5B+</h3>
              <p className="text-sm text-slate-500">Processed Monthly</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">100%</h3>
              <p className="text-sm text-slate-500">Compliance Rate</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">5,000+</h3>
              <p className="text-sm text-slate-500">Active Businesses</p>
            </div>
            <div>
              <h3 className="text-4xl font-bold text-primary mb-2">24/7</h3>
              <p className="text-sm text-slate-500">Priority Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-12 rounded-2xl text-center bg-primary/5">
            <h2 className="text-4xl font-bold mb-4">
              Ready to automate your business finances?
            </h2>
            <p className="text-slate-400 mb-8 text-lg">
              Join the new era of financial management. Compliant, efficient, and built for growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <button className="bg-primary hover:bg-opacity-90 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all hover-glow w-full sm:w-auto">
                  Create Free Account
                </button>
              </Link>
              <Link href="/contact">
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-lg font-bold text-lg transition-all w-full sm:w-auto">
                  Contact Sales
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Tax Calculators</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="#" className="hover:text-primary transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-sm text-slate-500">
            <p>© 2026 Ivano Technologies Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
