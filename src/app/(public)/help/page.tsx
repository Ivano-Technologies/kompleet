import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help Center | KOMPLEET",
  description:
    "Find answers to common questions and learn how to get the most out of KOMPLEET.",
};

const faqs = [
  {
    question: "How do I get started with KOMPLEET?",
    answer:
      "Sign up for a free account, complete your business profile, and start by uploading a Nigerian bank statement or creating your first invoice.",
  },
  {
    question: "What tax types does KOMPLEET support?",
    answer:
      "VAT (Value Added Tax) and related calculators under the Nigeria Tax Act 2025 are live today, including CIT and personal income tax tools. Filing-ready NRS and LIRS forms can be generated for download. A dedicated WHT calculator is on the roadmap. There is no PAYE calculator and no automated deadline reminders yet.",
  },
  {
    question: "Can I file taxes directly through KOMPLEET?",
    answer:
      "No. KOMPLEET generates filing-ready forms and reports for NRS and LIRS. You download them and submit through the official portals yourself. Direct portal submission is not available.",
  },
  {
    question: "How does the invoicing feature work?",
    answer:
      "Create invoices with VAT line items and NRS-compliant QR codes, then track payment status when your customer settles. Online checkout (Paystack/Flutterwave) is not live — payment recording is manual for now.",
  },
  {
    question: "Is my financial data secure?",
    answer:
      "Yes. Data is encrypted in transit and at rest. We use Supabase with row-level security. Production data is hosted in the EU (Ireland). We do not claim Nigerian data residency.",
  },
  {
    question: "What happens after the beta period?",
    answer:
      "We will introduce affordable pricing tiers designed for Nigerian SMEs. Beta users will receive early-bird pricing. We will communicate all changes well in advance.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. You can export transactions, invoices, tax reports, and financial statements in CSV and PDF formats at any time from the Export section of your dashboard.",
  },
  {
    question: "How do I import bank transactions?",
    answer:
      "Upload statements from any of 11 supported Nigerian banks. Parsers extract transactions and validate running balances before they enter your books. Open-banking account linking is not available.",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline mb-8 inline-block"
        >
          &larr; Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Help Center
          </h1>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary">
            Find answers to common questions about using KOMPLEET.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">&#128218;</div>
            <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
              Getting Started
            </h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              New to KOMPLEET? Start here to set up your account and learn the
              basics.
            </p>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">&#9881;</div>
            <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
              Tax Compliance
            </h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Learn about VAT, CIT, and filing-ready NRS and LIRS form generation.
            </p>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6 text-center">
            <div className="text-3xl mb-3">&#128172;</div>
            <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
              Contact Support
            </h3>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Need more help?{" "}
              <Link href="/contact" className="text-blue-600 hover:underline">
                Reach out
              </Link>{" "}
              to our support team.
            </p>
          </div>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-light-border dark:border-dark-border pb-6 last:border-0 last:pb-0"
              >
                <h3 className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                  {faq.question}
                </h3>
                <p className="text-light-text-secondary dark:text-dark-text-secondary">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-light-surface dark:bg-dark-surface rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
            Still need help?
          </h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
            Our support team is here for you.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-green-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-800 transition-colors"
          >
            Contact Support
          </Link>
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
