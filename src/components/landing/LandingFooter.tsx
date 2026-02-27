import Image from 'next/image';
import Link from 'next/link';

const LOGO_URL =
  "/logo.png";

export default function LandingFooter() {
  return (
    <footer className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image src={LOGO_URL} alt="KOMPLEET" width={28} height={28} className="rounded" />
              <span className="font-bold text-[rgb(var(--text-primary))]">KOMPLEET</span>
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
              Tax compliance and financial management for Nigerian SMEs.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[rgb(var(--text-primary))]">Product</h4>
            <ul className="space-y-2.5 text-sm text-[rgb(var(--text-secondary))]">
              <li>
                <a href="#features" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Features
                </a>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  API Docs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[rgb(var(--text-primary))]">Company</h4>
            <ul className="space-y-2.5 text-sm text-[rgb(var(--text-secondary))]">
              <li>
                <Link href="/about" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[rgb(var(--text-primary))]">Resources</h4>
            <ul className="space-y-2.5 text-sm text-[rgb(var(--text-secondary))]">
              <li>
                <Link href="/help" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Guides
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Webinars
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[rgb(var(--text-primary))]">Legal</h4>
            <ul className="space-y-2.5 text-sm text-[rgb(var(--text-secondary))]">
              <li>
                <Link href="/privacy" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-[rgb(var(--text-primary))] transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[rgb(var(--border))] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[rgb(var(--text-secondary))]">
          <p>&copy; 2026 KOMPLEET by Ivano Technologies Ltd. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="https://twitter.com/kompleetng" target="_blank" rel="noopener noreferrer" className="hover:text-[rgb(var(--text-primary))] transition-colors">
              Twitter
            </a>
            <a href="https://www.linkedin.com/company/kompleet" target="_blank" rel="noopener noreferrer" className="hover:text-[rgb(var(--text-primary))] transition-colors">
              LinkedIn
            </a>
            <a href="https://instagram.com/kompleet.ng" target="_blank" rel="noopener noreferrer" className="hover:text-[rgb(var(--text-primary))] transition-colors">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
