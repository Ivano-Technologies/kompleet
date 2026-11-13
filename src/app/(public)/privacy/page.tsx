import type { Metadata } from "next";
import Link from "next/link";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import {
  DATA_PROTECTION_EMAIL,
  GENERAL_CONTACT_EMAIL,
  OPERATOR_ADDRESS,
  OPERATOR_DPO,
  OPERATOR_LEGAL_NAME,
  OPERATOR_RC,
} from "@/lib/legal";

const PRIVACY_LINK = "text-primary underline underline-offset-2";
const HEADING =
  "text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4";
const BODY = "text-light-text-secondary dark:text-dark-text-secondary mb-4";
const LIST =
  "list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2";

export const metadata: Metadata = {
  title: "Kompleet: Privacy Policy",
  description:
    "Privacy Policy for Kompleet, the bookkeeping and invoicing web app. Covers data collection, use, storage, and your rights under Nigerian law.",
  alternates: { canonical: "/privacy" },
};

function SupportEmail() {
  return (
    <a href={`mailto:${DATA_PROTECTION_EMAIL}`} className={PRIVACY_LINK}>
      {DATA_PROTECTION_EMAIL}
    </a>
  );
}

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
            Last updated: 13 November 2026
          </p>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <p className={BODY}>
                Kompleet is provided by {OPERATOR_LEGAL_NAME} (&quot;Ivano&quot;,
                &quot;we&quot;, &quot;us&quot;), a company registered in Nigeria
                with the Corporate Affairs Commission under {OPERATOR_RC}. Our
                registered address is {OPERATOR_ADDRESS}. This policy explains
                what personal data Kompleet handles, why, and the rights you
                have under the Nigeria Data Protection Act 2023. This page is
                the current Privacy Policy for Kompleet.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={HEADING}>1. Who is responsible for your data</h2>
              <p className={BODY}>
                {OPERATOR_LEGAL_NAME} is the data controller for the personal
                data described in this policy. Our Data Protection Officer is{" "}
                {OPERATOR_DPO}. You can reach the Data Protection Officer and
                our support team at <SupportEmail />; for a data protection
                request, use the subject &quot;Data request&quot;.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={HEADING}>2. The data we handle</h2>
              <ul className={LIST}>
                <li>
                  <strong>Account data:</strong> your name, email address and
                  password (stored in hashed form), given when you create an
                  account. You sign in with your email address and password,
                  with a verification code sent to your email.
                </li>
                <li>
                  <strong>Your business records:</strong> the transactions,
                  invoices, expenses, categories and reports you create in
                  Kompleet, and bank statement files you choose to import.
                </li>
                <li>
                  <strong>Details of your own customers and suppliers:</strong>{" "}
                  names and contact details you enter, for example on invoices.
                  You are the controller of that data towards your customers;
                  we process it only to provide Kompleet to you.
                </li>
                <li>
                  <strong>Technical data:</strong> device, browser and log data
                  needed to run and secure the service, and your cookie
                  choices.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className={HEADING}>
                3. Why we handle it, and our lawful bases
              </h2>
              <ul className={LIST}>
                <li>
                  To provide Kompleet to you under our contract: account data,
                  your business records, and the customer details you enter.
                </li>
                <li>
                  To meet legal obligations, including tax record keeping:
                  issued invoices and related records are retained as described
                  in section 6.
                </li>
                <li>
                  For our legitimate interests in keeping Kompleet secure,
                  preventing abuse and improving the service: technical and log
                  data.
                </li>
                <li>
                  With your consent, where the law requires it: optional
                  cookies, as described in our{" "}
                  <Link href="/cookies" className={PRIVACY_LINK}>
                    Cookie Notice
                  </Link>
                  . You can withdraw consent at any time.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className={HEADING}>4. Who we share it with</h2>
              <p className={BODY}>
                We share personal data only with the processors that run
                Kompleet: Convex, which hosts the application database; Vercel,
                which hosts the website and application; Resend, which sends
                account and verification emails; and Sentry, which provides
                error tracking so we can find and fix faults (where an error
                occurs, Sentry may record a masked replay of the session, with
                text and inputs hidden). If you use Kompleet&apos;s AI features,
                such as automatic transaction categorisation or document
                import, the content you submit for those features is processed
                by Anthropic and OpenAI to produce the result. When you buy a
                Kompleet licence through our company website, payment is
                processed by Paystack under the Ivano Technologies Terms of
                Service and Refund Policy; we do not receive or store your full
                card details. We do not sell personal data. We may disclose
                data where the law requires it.
              </p>
              <p className={BODY}>
                Some processors store data outside Nigeria. Where personal data
                is transferred across borders, we rely on the safeguards the
                Nigeria Data Protection Act 2023 permits and on our contracts
                with those processors.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={HEADING}>5. Your rights</h2>
              <p className={BODY}>
                Under the Nigeria Data Protection Act 2023 you can ask us to:
                give you access to your personal data; correct data that is
                wrong; delete your data, subject to section 6; give you a copy
                in a portable format; restrict or object to how we use it; and
                withdraw consent where consent is the basis. You can export
                your business records yourself at any time from the Export
                Centre in Kompleet, and you can delete your account in
                Settings, Account. For any other request, email{" "}
                <SupportEmail /> with the subject &quot;Data request&quot;. We
                respond within the time the Act allows. If you are not
                satisfied, you may complain to the Nigeria Data Protection
                Commission.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={HEADING}>6. How long we keep it</h2>
              <p className={BODY}>
                Account data is kept while your account is active. If you
                delete your account, we delete or anonymise your personal data
                except records the law requires us to keep: issued invoices and
                tax records are retained for six years from the end of the
                relevant tax year, as Nigerian tax law requires, and are then
                deleted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={HEADING}>7. Security</h2>
              <p className={BODY}>
                Access to Kompleet is over encrypted connections, account
                access is protected by password and email verification, and
                application data is held with our processors under access
                controls. No system is perfectly secure; if we become aware of
                a personal data breach that affects you, we will notify you and
                the Nigeria Data Protection Commission as the Act requires.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={HEADING}>8. Children</h2>
              <p className={BODY}>
                Kompleet is a business tool and is not offered to anyone under
                18.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={HEADING}>9. Changes to this policy</h2>
              <p className={BODY}>
                We may update this policy. The date at the top shows when it
                last changed. Material changes will be announced in Kompleet or
                by email before they take effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={HEADING}>10. Contact us</h2>
              <p className={BODY}>
                {OPERATOR_LEGAL_NAME}, {OPERATOR_RC}, {OPERATOR_ADDRESS}.
              </p>
              <p className={BODY}>
                General contact:{" "}
                <a
                  href={`mailto:${GENERAL_CONTACT_EMAIL}`}
                  className={PRIVACY_LINK}
                >
                  {GENERAL_CONTACT_EMAIL}
                </a>
                . Support and data requests: <SupportEmail />. Data Protection
                Officer: {OPERATOR_DPO}, reachable at <SupportEmail /> with the
                subject &quot;Data request&quot;.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-light-border dark:border-dark-border">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
              © 2026 Ivano Technologies Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
