import Image from "next/image";
import Link from "next/link";

const LOGO_URL = "/assets/logo-primary.png";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <Image
                src={LOGO_URL}
                alt="KOMPLEET"
                width={28}
                height={28}
                className="rounded"
              />
              <span className="font-ceoruse text-sm font-bold uppercase text-text-1">
                KOMPLEET
              </span>
            </div>
            <p className="text-sm leading-relaxed text-text-2">
              Tax compliance and financial management for Nigerian SMEs.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-text-1">Product</h4>
            <ul className="space-y-2.5 text-sm text-text-2">
              <li>
                <Link href="/#features" className="hover:text-text-1">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-text-1">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#security" className="hover:text-text-1">
                  Security
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="hover:text-text-1">
                  API Docs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-text-1">Company</h4>
            <ul className="space-y-2.5 text-sm text-text-2">
              <li>
                <Link href="/about" className="hover:text-text-1">
                  About
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-text-1">
                  Help
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-text-1">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-text-1">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-text-1">Resources</h4>
            <ul className="space-y-2.5 text-sm text-text-2">
              <li>
                <Link href="/help" className="hover:text-text-1">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-text-1">
                  Press
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-text-1">
                  Guides
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold text-text-1">Legal</h4>
            <ul className="space-y-2.5 text-sm text-text-2">
              <li>
                <Link href="/privacy" className="hover:text-text-1">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-text-1">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-text-1">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-text-2 md:flex-row">
          <p>&copy; 2026 KOMPLEET by Ivano Technologies Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <a
              href="mailto:hi@ivanotechnologies.com"
              className="hover:text-text-1"
            >
              hi@ivanotechnologies.com
            </a>
            <a
              href="mailto:support@ivanotechnologies.com"
              className="hover:text-text-1"
            >
              support@ivanotechnologies.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
