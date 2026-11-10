import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  alternates: { canonical: "/careers" },
  title: "Kompleet: Careers",
  description:
    "Join the Kompleet team and help build the future of financial management for Nigerian businesses.",
};

export default function CareersPage() {
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
            Careers at Kompleet
          </h1>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
            We are building the future of financial management for Nigerian
            SMEs. If you are passionate about technology, fintech, and making a
            real impact in Africa, we want to hear from you.
          </p>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">
            Open Positions
          </h2>
          <div className="bg-light-background dark:bg-dark-background rounded-lg p-8 text-center">
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              No open roles right now. Send a CV and a short note to{" "}
              <a
                href="mailto:hi@ivanotechnologies.com"
                className="text-primary hover:underline"
              >
                hi@ivanotechnologies.com
              </a>
              .
            </p>
          </div>
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
