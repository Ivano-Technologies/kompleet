import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Press | KOMPLEET',
  description: 'Press resources and media information for KOMPLEET by Ivano Technologies.',
};

export default function PressPage() {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-8 inline-block">&larr; Back to Home</Link>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">Press &amp; Media</h1>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
            Resources for journalists and media professionals covering KOMPLEET and the Nigerian fintech space.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Press Contact</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">For press inquiries, interviews, and media requests:</p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              <a href="mailto:press@techivano.com" className="text-blue-600 hover:underline">press@techivano.com</a>
            </p>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8">
            <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Brand Assets</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Our brand kit including logos, color specifications, and usage guidelines is available upon request.
            </p>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
              Contact <a href="mailto:press@techivano.com" className="text-blue-600 hover:underline">press@techivano.com</a> to request the media kit.
            </p>
          </div>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">About KOMPLEET</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed mb-4">
            KOMPLEET is a financial management and tax compliance platform built specifically for Nigerian SMEs. Developed by Ivano Technologies Ltd, the platform automates VAT, WHT, and PAYE calculations, generates professional invoices, and provides real-time cashflow analytics.
          </p>
          <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
            Currently in beta, KOMPLEET serves over 5,000 businesses across Nigeria, processing more than &#x20A6;2.5 billion in monthly transactions.
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
