import Image from "next/image";
import Link from "next/link";

const LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/114473754/ZeGQuujTZDuMQDVT.png";

export default function LandingFooter() {
  return (
    <footer className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src={LOGO_URL}
                alt="KOMPLEET"
                width={28}
                height={28}
                className="rounded"
              />
              <span className="font-bold text-[rgb(var(--text-primary))]">
                KOMPLEET
              </span>
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
              Tax compliance and financial management for Nigerian SMEs.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[rgb(var(--text-primary))]">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm text-[rgb(var(--text-secondary))]">
              <li>
                <a
                  href="#features"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Security
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  API Docs
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[rgb(var(--text-primary))]">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm text-[rgb(var(--text-secondary))]">
              <li>
                <Link
                  href="/about"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Careers
                </a>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[rgb(var(--text-primary))]">
              Resources
            </h4>
            <ul className="space-y-2.5 text-sm text-[rgb(var(--text-secondary))]">
              <li>
                <Link
                  href="/help"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Guides
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Webinars
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-4 text-[rgb(var(--text-primary))]">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-[rgb(var(--text-secondary))]">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Terms
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[rgb(var(--border))] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[rgb(var(--text-secondary))]">
          <p>
            &copy; 2026 KOMPLEET by Ivano Technologies Ltd. All rights reserved.
          </p>
          <div className="flex gap-5">
            <a
              href="#"
              className="hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              Twitter
            </a>
            <a
              href="#"
              className="hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="#"
              className="hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
