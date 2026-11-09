import Link from "next/link";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { CookieSettingsButton } from "@/components/cookies/CookieSettingsButton";
import { COMPANY_LEGAL } from "@/lib/legal";

const COLUMN_HEADING =
  "mb-3 flex h-5 items-center text-sm font-semibold text-text-1";
const COLUMN_LINKS = "space-y-3 text-sm text-text-2";
const COLUMN_LINK = "hover:text-text-1";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3 flex h-5 items-center">
              <BrandLockup size="sm" />
            </div>
            <p className="text-sm leading-relaxed text-text-2">
              Simple bookkeeping and invoicing for Nigerian SMEs.
            </p>
          </div>
          <div>
            <h4 className={COLUMN_HEADING}>Product</h4>
            <ul className={COLUMN_LINKS}>
              <li>
                <Link href="/privacy" className={COLUMN_LINK}>
                  Security
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className={COLUMN_LINK}>
                  API Docs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className={COLUMN_HEADING}>Company</h4>
            <ul className={COLUMN_LINKS}>
              <li>
                <Link href="/about" className={COLUMN_LINK}>
                  About
                </Link>
              </li>
              <li>
                <Link href="/careers" className={COLUMN_LINK}>
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className={COLUMN_LINK}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className={COLUMN_HEADING}>Resources</h4>
            <ul className={COLUMN_LINKS}>
              <li>
                <Link href="/help" className={COLUMN_LINK}>
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/press" className={COLUMN_LINK}>
                  Press
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className={COLUMN_HEADING}>Legal</h4>
            <ul className={COLUMN_LINKS}>
              <li>
                <a href={COMPANY_LEGAL.privacy} className={COLUMN_LINK}>
                  Privacy
                </a>
              </li>
              <li>
                <a href={COMPANY_LEGAL.terms} className={COLUMN_LINK}>
                  Terms
                </a>
              </li>
              <li>
                <a href={COMPANY_LEGAL.refunds} className={COLUMN_LINK}>
                  Refunds
                </a>
              </li>
              <li>
                <Link href="/cookies" className={COLUMN_LINK}>
                  Cookies
                </Link>
              </li>
              <li>
                <CookieSettingsButton />
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-6 border-t border-border pt-8 text-sm text-text-2 md:flex-row md:items-center md:justify-between">
          <p>
            &copy; 2026 Kompleet by Ivano Technologies Ltd. All rights reserved.
          </p>
          <nav
            className="flex flex-wrap items-center gap-6"
            aria-label="Legal and contact"
          >
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <a href="mailto:hi@ivanotechnologies.com">
              hi@ivanotechnologies.com
            </a>
            <a href="mailto:support@ivanotechnologies.com">
              support@ivanotechnologies.com
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
