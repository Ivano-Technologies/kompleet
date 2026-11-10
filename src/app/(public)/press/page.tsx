import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/press" },
  title: "Kompleet: Press",
  description:
    "Press resources and media information for Kompleet by Ivano Technologies Ltd.",
};

export default function PressPage() {
  return (
    <div data-marketing className="min-h-screen bg-bg dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-sm text-primary hover:underline mb-8 inline-block"
        >
          &larr; Back to Home
        </Link>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Press &amp; Media
          </h1>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
            Resources for journalists and media professionals covering Kompleet
            and the Nigerian fintech space.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              Press Contact
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              For press inquiries, interviews, and media requests:
            </p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              <a
                href="mailto:hi@ivanotechnologies.com"
                className="text-primary hover:underline"
              >
                hi@ivanotechnologies.com
              </a>
            </p>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              Brand Assets
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Our brand kit including logos, color specifications, and usage
              guidelines is available upon request.
            </p>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              Contact{" "}
              <a
                href="mailto:hi@ivanotechnologies.com"
                className="text-primary hover:underline"
              >
                hi@ivanotechnologies.com
              </a>{" "}
              to request the media kit.
            </p>
          </div>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
            About Kompleet
          </h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
            Kompleet is a bookkeeping and invoicing platform built for Nigerian
            SMEs. Developed by Ivano Technologies Ltd, it supports Nigerian
            bank statement import, transaction categorization, expense
            tracking, invoicing with payment tracking, and P&amp;L and balance
            sheet reports.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-light-border dark:border-dark-border">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
            &copy; 2026 Ivano Technologies Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
