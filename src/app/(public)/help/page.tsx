import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  alternates: { canonical: "/help" },
  title: "Kompleet: Help Center",
  description:
    "Find answers to common questions and learn how to get the most out of Kompleet.",
};

const faqs = [
  {
    question: "How do I get started with Kompleet?",
    answer:
      "Create an account, complete your business profile, and start by uploading a Nigerian bank statement or creating your first invoice.",
  },
  {
    question: "What can I do with Kompleet?",
    answer:
      "Import bank statements, categorize transactions, track spending, send invoices, and export P&L and balance sheet reports, all from one web app.",
  },
  {
    question: "Can I file taxes directly through Kompleet?",
    answer:
      "Kompleet generates filing-ready forms and reports for NRS and LIRS that you download and submit through the official portals yourself.",
  },
  {
    question: "How does the invoicing feature work?",
    answer:
      "Create invoices, send them to customers, and record payment when they settle.",
  },
  {
    question: "Is my financial data secure?",
    answer:
      "Yes. Your data is encrypted in transit and at rest, and access is limited to your account.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Yes. You can export transactions, invoices, and financial statements in CSV and PDF formats at any time from the Export section of your dashboard.",
  },
  {
    question: "How do I import bank transactions?",
    answer:
      "Upload statements from 11 supported Nigerian banks. Transactions are checked against running balances before they enter your books.",
  },
];

const topics = [
  {
    title: "Getting started",
    body: "Create an account, add your business profile, then import a statement or issue an invoice.",
  },
  {
    title: "Invoicing and reports",
    body: "Send invoices, track payments, and export P&L and balance sheet reports.",
  },
  {
    title: "Contact support",
    body: "Need more help? Reach out from the contact page on a business day.",
  },
];

export default function HelpPage() {
  return (
    <div data-marketing className="flex min-h-screen flex-col bg-bg text-text-1 dark:bg-dark-bg dark:text-dark-text-1">
      <LandingNav />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-display mb-4 text-4xl font-bold">Help Center</h1>
          <p className="text-lg text-text-2">
            Answers for using Kompleet.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {topics.map((topic) => (
            <div
              key={topic.title}
              className="rounded-xl border border-border bg-surface p-6 dark:border-dark-border dark:bg-dark-surface"
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

        <div className="rounded-xl border border-border bg-surface p-8 dark:border-dark-border dark:bg-dark-surface">
          <h2 className="font-display mb-8 text-2xl font-semibold">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="border-b border-border pb-6 last:border-0 last:pb-0 dark:border-dark-border"
              >
                <h3 className="mb-2 text-lg font-medium text-text-1">
                  {faq.question}
                </h3>
                <p className="text-text-2">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center dark:border-dark-border dark:bg-dark-surface">
          <h3 className="mb-2 text-lg font-semibold">Still need help?</h3>
          <p className="mb-4 text-text-2">Write to support from the contact page.</p>
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
