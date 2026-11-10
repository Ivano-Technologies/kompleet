import type { Metadata } from "next";
import Link from "next/link";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { CompanyLegalNotice } from "@/components/legal/CompanyLegalNotice";
import {
  COMPANY_ADDRESS,
  COMPANY_NAME,
  COMPANY_RC,
  DPO_NAME,
  DSR_EMAIL,
  DSR_RESPONSE_DAYS,
  NDPC_URL,
} from "@/lib/legal";

const PRIVACY_LINK = "text-primary underline underline-offset-2";

export const metadata: Metadata = {
  title: "Kompleet: Privacy Policy",
  description:
    "Privacy Policy for Kompleet, the bookkeeping and invoicing web app. Covers data collection, use, storage, and your rights under Nigerian law.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div data-marketing className="min-h-screen bg-bg dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
      <SkipToContent />
      <main id="main-content" className="max-w-4xl mx-auto">
        <Link
          href="/"
          className={`mb-6 inline-flex min-h-11 items-center text-sm ${PRIVACY_LINK} dark:text-dark-text-2`}
        >
          &larr; Back to Home
        </Link>
        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8">
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Privacy Policy
          </h1>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-8">
          Last updated: 10 November 2026. Effective date: February 25, 2026.
        </p>

        <CompanyLegalNotice page="privacy" />

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              1. Introduction
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Welcome to KOMPLEET (&quot;we,&quot; &quot;our,&quot; or
              &quot;us&quot;), a bookkeeping and invoicing web app operated by{" "}
              {COMPANY_NAME} ({COMPANY_RC}), {COMPANY_ADDRESS}. We are committed
              to protecting your personal information and your right to privacy.
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use Kompleet.
            </p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              By using KOMPLEET, you agree to the collection and use of
              information in accordance with this policy. If you do not agree
              with our policies and practices, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              2. Information We Collect
            </h2>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              2.1 Personal Information
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We collect personal information that you voluntarily provide to us
              when you register on the platform, including:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>
                Name and contact information (email address, phone number)
              </li>
              <li>Account credentials (email address and password)</li>
              <li>Tax identification numbers (TIN)</li>
              <li>
                Business information (company name, registration number,
                business type)
              </li>
              <li>Financial information necessary for tax calculations</li>
              <li>
                Uploaded documents (e.g. bank statements, receipts) for
                transaction import and receipt storage
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              2.2 Authentication Information
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              You create and sign in to a Kompleet account with email and
              password only. We do not offer Google sign-in or other third-party
              authentication providers. We store a hashed password and send a
              one-time verification or reset code to your email.
            </p>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              2.3 Usage Data
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We automatically collect certain information when you visit, use,
              or navigate our platform:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and preferences</li>
              <li>Tax calculation history and saved reports</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              3. Lawful Bases (Nigeria Data Protection Act 2023)
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We process personal data only where a lawful basis under the NDPA
              2023 applies. For Kompleet that is:
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-left text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <thead>
                  <tr>
                    <th className="border-b border-light-border dark:border-dark-border py-2 pr-4 font-semibold text-light-text-primary dark:text-dark-text-primary">
                      Purpose
                    </th>
                    <th className="border-b border-light-border dark:border-dark-border py-2 font-semibold text-light-text-primary dark:text-dark-text-primary">
                      Lawful basis
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top">
                      Creating and running your account, books, invoices, and
                      tax calculations
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 align-top">
                      Performance of a contract
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top">
                      Email verification and password-reset codes
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 align-top">
                      Performance of a contract
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top">
                      Keeping issued invoices after you erase your account
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 align-top">
                      Legal obligation (Nigerian tax record-keeping)
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top">
                      Security, abuse prevention, and diagnosing errors
                      (including Sentry)
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 align-top">
                      Legitimate interests
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">
                      Google Analytics, only if you accept analytics cookies and
                      a measurement ID is configured
                    </td>
                    <td className="py-2 align-top">Consent</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              4. How We Use Your Information
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We use the information we collect or receive to:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Provide, operate, and maintain our services</li>
              <li>Process your tax calculations and generate reports</li>
              <li>Manage your account and provide customer support</li>
              <li>
                Send you updates, notifications, and administrative information
              </li>
              <li>Improve and personalize your experience on our platform</li>
              <li>Comply with Nigerian tax laws and regulatory requirements</li>
              <li>
                Detect, prevent, and address technical issues and security
                threats
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              5. Data Storage and Security
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We implement appropriate technical and organizational security
              measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Data is encrypted in transit using SSL/TLS protocols</li>
              <li>
                Sensitive data is encrypted at rest in our secure databases
              </li>
              <li>
                Access to personal information is restricted to authorized
                personnel only
              </li>
              <li>
                We use industry-standard authentication and authorization
                mechanisms
              </li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We do not claim Nigerian data residency. Receipt text extraction
              runs in our application using Tesseract.js on our servers. We do
              not send receipt images to a third-party OCR vendor.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              6. Processors and International Transfers
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We do not sell, trade, or rent your personal information to third
              parties. We share it with processors who help us operate Kompleet,
              when required by law, or with your consent. Those processors
              currently include:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>
                <strong>Convex:</strong> application database, authentication,
                and file storage
              </li>
              <li>
                <strong>Vercel:</strong> application hosting. Production is
                configured to run in region <strong>iad1</strong> (United
                States)
              </li>
              <li>
                <strong>Resend:</strong> transactional email (verification,
                password reset, reminders, and contact form)
              </li>
              <li>
                <strong>Sentry:</strong> error monitoring and session replay on
                error (see section 7)
              </li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              These processors are outside Nigeria. Transfers are made with
              appropriate safeguards required by the NDPA 2023, including
              written contracts that require confidentiality and security.
            </p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              We may also disclose information when required by law or in
              response to valid requests by public authorities (for example
              Nigerian tax authorities), or in connection with a merger, sale,
              or acquisition of our business.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              7. Sentry Session Replay
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We use Sentry to diagnose errors. We do not record sessions as a
              matter of course. If an error occurs, Sentry may capture a session
              replay of that visit so we can see what went wrong. In that
              replay:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>All on-screen text is masked</li>
              <li>Form inputs are masked</li>
              <li>Media elements are blocked</li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Sentry is configured not to send default personally identifying
              information such as IP addresses with those events.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              8. Your Privacy Rights
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Under the Nigeria Data Protection Act 2023, you have the following
              rights:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>
                <strong>Access:</strong> Request access to your personal
                information
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate or
                incomplete data
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal
                information
              </li>
              <li>
                <strong>Objection:</strong> Object to the processing of your
                personal information
              </li>
              <li>
                <strong>Data Portability:</strong> Request a copy of your data
                in a structured format
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Withdraw your consent at any
                time where processing is based on consent
              </li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              You can erase your account in Settings. That deletes your profile
              and books, subject to the invoice retention described below.
            </p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              To exercise any of these rights, including access and portability,
              email{" "}
              <a
                href={`mailto:${DSR_EMAIL}`}
                className={`inline-flex min-h-11 items-center ${PRIVACY_LINK}`}
              >
                {DSR_EMAIL}
              </a>
              . That is the only address for data-protection requests. We aim to
              respond within {DSR_RESPONSE_DAYS} days.
            </p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              You have the right to complain to the Nigeria Data Protection
              Commission (NDPC) if you believe we have not handled your personal
              data in line with the NDPA 2023. See{" "}
              <a
                href={NDPC_URL}
                className={`inline-flex min-h-11 items-center ${PRIVACY_LINK}`}
              >
                ndpc.gov.ng
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              9. Data Retention
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We keep personal data only for as long as needed for the purposes
              above, including:
            </p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-left text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <thead>
                  <tr>
                    <th className="border-b border-light-border dark:border-dark-border py-2 pr-4 font-semibold text-light-text-primary dark:text-dark-text-primary">
                      Data
                    </th>
                    <th className="border-b border-light-border dark:border-dark-border py-2 font-semibold text-light-text-primary dark:text-dark-text-primary">
                      Retention
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top">
                      Account, books, files, drafts, and related records
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 align-top">
                      Until you erase your account (or we close it)
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top">
                      Issued invoices after erasure
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 align-top">
                      6 years, with names and addresses replaced by a
                      placeholder
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top">
                      Authentication cookies
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 align-top">
                      Browser session, or until you sign out
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top">
                      Cookie consent and theme preference (local storage)
                    </td>
                    <td className="py-2 align-top">
                      Until you change the setting or clear site data
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              10. Personal Data Breach
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              If we become aware of a personal data breach, we will notify the
              Nigeria Data Protection Commission within 72 hours of becoming
              aware of it, and we will notify affected data subjects, as
              required by the NDPA 2023.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              11. Cookies and Tracking Technologies
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We use cookies and local storage to keep you signed in, remember
              your theme, and store your analytics-cookie choice. Google
              Analytics cookies are set only if you accept them and a
              measurement ID is configured. Details, including names and
              durations, are in our{" "}
              <Link href="/cookies" className={PRIVACY_LINK}>
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              12. Children&apos;s Privacy
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              KOMPLEET is not intended for use by individuals under the age of
              18. We do not knowingly collect personal information from
              children. If you believe we have collected information from a
              child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              13. Changes to This Privacy Policy
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices or legal requirements. We will notify you
              of any material changes by:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Posting the updated policy on this page</li>
              <li>Updating the &quot;Last updated&quot; date</li>
              <li>
                Sending you an email notification (for significant changes)
              </li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Your continued use of KOMPLEET after any changes indicates your
              acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              14. Contact Us
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact our Data
              Protection Officer, {DPO_NAME}, at {DSR_EMAIL}:
            </p>
            <div className="bg-light-background dark:bg-dark-background p-6 rounded-lg">
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2">
                <strong>{COMPANY_NAME}</strong>
              </p>
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2">
                {COMPANY_RC}
              </p>
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2">
                {COMPANY_ADDRESS}
              </p>
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2">
                Data Protection Officer: {DPO_NAME}
              </p>
              <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2">
                Email:{" "}
                <a
                  href={`mailto:${DSR_EMAIL}`}
                  className={`inline-flex min-h-11 items-center ${PRIVACY_LINK}`}
                >
                  {DSR_EMAIL}
                </a>
              </p>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                Website:{" "}
                <a
                  href="https://www.ivanotechnologies.com"
                  className={`inline-flex min-h-11 items-center ${PRIVACY_LINK}`}
                >
                  https://www.ivanotechnologies.com
                </a>
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              15. Governing Law
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              This Privacy Policy is governed by and construed in accordance
              with the laws of the Federal Republic of Nigeria, including the
              Nigeria Data Protection Act 2023 and regulations issued by the
              Nigeria Data Protection Commission (NDPC).
            </p>
          </section>
        </div>

          <div className="mt-12 pt-8 border-t border-light-border dark:border-dark-border">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
              © 2026 {COMPANY_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
