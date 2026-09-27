import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

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
      "Yes. Data is encrypted in transit and at rest. The app is hosted on Convex. We do not claim Nigerian data residency.",
  },
  {
    question: "What happens after the beta period?",
    answer:
      "We will publish paid tiers for Nigerian SMEs before charging anyone. Beta users get advance notice and a stated early-tester discount.",
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

const topics = [
  {
    title: "Getting started",
    body: "Create an account, add your business profile, then import a statement or issue an invoice.",
  },
  {
    title: "Tax compliance",
    body: "VAT, CIT, and filing-ready NRS and LIRS form generation.",
  },
  {
    title: "Contact support",
    body: "Need more help? Reach out and we will reply on a business day.",
  },
];

export default function HelpPage() {
  return (
    <div data-marketing className="flex min-h-screen flex-col bg-bg text-text-1">
      <LandingNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-display mb-4 text-4xl font-bold">Help Center</h1>
          <p className="text-lg text-text-2">
            Answers about using KOMPLEET today.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {topics.map((topic) => (
            <div
              key={topic.title}
              className="rounded-xl border border-border bg-surface p-6"
            >
              <h3 className="mb-2 font-semibold text-text-1">{topic.title}</h3>
              <p className="text-sm text-text-2">{topic.body}</p>
              {topic.title === "Contact support" && (
                <p className="mt-3 text-sm">
                  <Link href="/contact" className="text-primary hover:underline">
                    Contact us
                  </Link>
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-surface p-8">
          <h2 className="font-display mb-8 text-2xl font-semibold">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="border-b border-border pb-6 last:border-0 last:pb-0"
              >
                <h3 className="mb-2 text-lg font-medium text-text-1">
                  {faq.question}
                </h3>
                <p className="text-text-2">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center">
          <h3 className="mb-2 text-lg font-semibold">Still need help?</h3>
          <p className="mb-4 text-text-2">Write to support and we will reply.</p>
          <Link
            href="/contact"
            className="inline-block rounded-md bg-accent px-6 py-3 text-sm font-bold text-charcoal hover:bg-accent-hover"
          >
            Contact support
          </Link>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
