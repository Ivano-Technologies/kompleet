import type { Metadata } from "next";
import Link from "next/link";
import { CompanyLegalNotice } from "@/components/legal/CompanyLegalNotice";
import {
  COMPANY_LEGAL,
  DATA_PROTECTION_EMAIL,
  GENERAL_CONTACT_EMAIL,
  OPERATOR_ADDRESS,
  OPERATOR_DPO,
  OPERATOR_LEGAL_NAME,
  OPERATOR_RC,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Kompleet: Terms of Service",
  description:
    "Terms of Service for Kompleet, the bookkeeping and invoicing web app. Covers user responsibilities, disclaimers, and governing law.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div data-marketing className="min-h-screen bg-bg dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-sm text-primary hover:underline dark:text-dark-text-2 mb-6 inline-block"
        >
          &larr; Back to Home
        </Link>
        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8">
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
            Terms of Service
          </h1>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-8">
          Last updated: 13 November 2026
        </p>

        <CompanyLegalNotice page="terms" />

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              1. Agreement to Terms
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Welcome to Kompleet, a bookkeeping and invoicing platform operated
              by Ivano Technologies Ltd ("Company," "we," "us," or "our"). These
              Terms of Service ("Terms") govern your access to and use of our
              website, platform, and services (collectively, the "Services").
            </p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              By accessing or using Kompleet, you agree to be bound by these
              Terms and our Privacy Policy. If you do not agree to these Terms,
              you may not access or use our Services.
            </p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              We reserve the right to modify these Terms at any time. Your
              continued use of the Services after any changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              2. Description of Services
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Kompleet provides bookkeeping, invoicing, and calculation tools
              designed to help individuals and businesses in Nigeria:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>
                Calculate business taxes, individual taxes, VAT, and capital
                allowances
              </li>
              <li>Generate tax reports and documentation</li>
              <li>Store and manage tax calculation history</li>
              <li>
                Access information about Nigerian tax laws and regulations
              </li>
              <li>
                Track income, expenses, and invoices, and export financial
                reports
              </li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Our Services are provided for informational and calculation
              purposes only and do not constitute professional tax advice, legal
              advice, or accounting services. Kompleet is not a substitute for
              professional tax or legal advice from a qualified advisor.
            </p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Features such as transaction categorization may use automated or
              AI-assisted tools. These are for convenience only and are not
              legal or tax advice; you remain responsible for verifying
              categorizations and accuracy before relying on them for filing.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              3. User Accounts and Registration
            </h2>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              3.1 Account Creation
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              To access certain features of Kompleet, you must create an account
              by providing:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Valid email address</li>
              <li>Secure password</li>
            </ul>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              3.2 Account Responsibilities
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>
                Maintaining the confidentiality of your account credentials
              </li>
              <li>All activities that occur under your account</li>
              <li>
                Notifying us immediately of any unauthorized access or security
                breach
              </li>
              <li>Providing accurate, current, and complete information</li>
              <li>Updating your information to keep it accurate and current</li>
            </ul>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              3.3 Account Eligibility
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              You must be at least 18 years old and have the legal capacity to
              enter into binding contracts to use Kompleet. By creating an
              account, you represent and warrant that you meet these
              requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              4. Acceptable Use Policy
            </h2>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              4.1 Permitted Use
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              You may use Kompleet only for lawful purposes and in accordance
              with these Terms. You agree to use the Services:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>
                In line with all applicable Nigerian laws and regulations
              </li>
              <li>For legitimate tax calculation and record-keeping purposes</li>
              <li>In a manner that does not infringe the rights of others</li>
            </ul>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              4.2 Prohibited Activities
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Use the Services for any illegal or unauthorized purpose</li>
              <li>
                Attempt to gain unauthorized access to our systems or networks
              </li>
              <li>Interfere with or disrupt the Services or servers</li>
              <li>
                Use automated systems (bots, scrapers) without our permission
              </li>
              <li>
                Reverse engineer, decompile, or disassemble any part of the
                Services
              </li>
              <li>Upload or transmit viruses, malware, or malicious code</li>
              <li>
                Impersonate any person or entity or misrepresent your
                affiliation
              </li>
              <li>Collect or harvest personal information of other users</li>
              <li>Use the Services to facilitate tax evasion or fraud</li>
              <li>
                Resell, redistribute, or commercially exploit the Services
                without authorization
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              5. Intellectual Property Rights
            </h2>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              5.1 Our Property
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              All content, features, and functionality of Kompleet, including
              but not limited to:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Software, code, and algorithms</li>
              <li>Text, graphics, logos, and images</li>
              <li>Tax calculation methodologies and formulas</li>
              <li>Database structures and compilations</li>
              <li>Trademarks, service marks, and trade names</li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              are owned by Ivano Technologies Ltd and are protected by Nigerian
              and international copyright, trademark, and other intellectual
              property laws.
            </p>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              5.2 Your Content
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              You retain ownership of any data, information, or content you
              submit to Kompleet ("User Content"). By submitting User Content,
              you grant us a limited license to:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Store and process your data to provide the Services</li>
              <li>
                Use aggregated, anonymized data for analytics and service
                improvement
              </li>
              <li>Display your calculation results and reports to you</li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              We will not share your User Content with third parties except as
              described in our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              6. Disclaimers and Limitations
            </h2>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              6.1 No Professional Advice
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              <strong>IMPORTANT:</strong> Kompleet provides tax calculation
              tools and information for general guidance only. Our Services are
              not a substitute for professional tax, legal, or accounting
              advice. Our Services do not constitute:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Professional tax advice</li>
              <li>Legal advice</li>
              <li>Accounting or financial advice</li>
              <li>Personalized recommendations for your specific situation</li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              You should consult with qualified tax professionals, accountants,
              or legal advisors before making any tax-related decisions or
              filing tax returns.
            </p>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              6.2 Accuracy of Information
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              While we strive to provide accurate and up-to-date information
              based on Nigerian tax laws:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Tax laws and regulations change frequently</li>
              <li>Calculations are based on information you provide</li>
              <li>
                We do not guarantee the accuracy, completeness, or currency of
                any information
              </li>
              <li>
                You are responsible for verifying all calculations and
                information
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              6.3 Service Availability
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              We provide the Services on an "AS IS" and "AS AVAILABLE" basis. We
              do not guarantee that the Services will be uninterrupted, without
              errors, viruses, or other harmful components.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              7. Limitation of Liability
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY NIGERIAN LAW:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>
                We are not liable for any indirect, incidental, special,
                consequential, or punitive damages
              </li>
              <li>
                We are not liable for any loss of profits, revenue, data, or
                business opportunities
              </li>
              <li>
                We are not liable for any errors in tax calculations or
                filing issues
              </li>
              <li>
                We are not liable for any penalties, fines, or interest imposed
                by tax authorities
              </li>
              <li>
                Our total liability to you for any claims shall not exceed the
                amount you paid us in the past 12 months
              </li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              You acknowledge that you use Kompleet at your own risk and are
              solely responsible for your tax obligations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              8. Indemnification
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              You agree to indemnify, defend, and hold harmless Ivano Technologies Ltd,
              its officers, directors, employees, and agents
              from any claims, liabilities, damages, losses, costs, or expenses
              (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Your use or misuse of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any applicable laws or regulations</li>
              <li>Your infringement of any third-party rights</li>
              <li>Any User Content you submit to Kompleet</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              9. Fees and Payment
            </h2>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              9.1 Access
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Access to Kompleet is through a one-off founding payment. The
              price is shown at checkout.
            </p>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              9.2 Payment Terms
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              When you complete a founding payment:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>You agree to pay the amount shown at checkout</li>
              <li>
                Fees follow the Ivano Technologies Ltd refund policy, which
                provides a 14-day refund window. See{" "}
                <a
                  href={COMPANY_LEGAL.refunds}
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Refund Policy
                </a>
                .
              </li>
              <li>
                You are responsible for all taxes associated with your purchase
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              9.3 Account cancellation
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              You may delete your account at any time using the account
              deletion feature in your settings, or by contacting support.
              Founding payments follow the 14-day refund window in the{" "}
              <a
                href={COMPANY_LEGAL.refunds}
                className="font-medium text-primary underline underline-offset-2"
              >
                Refund Policy
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              10. Termination
            </h2>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              10.1 Termination by You
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              You may terminate your account at any time by:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Contacting our support team</li>
              <li>Using the account deletion feature in your settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              10.2 Termination by Us
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We may suspend or terminate your account immediately, without
              notice, if:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>You violate these Terms</li>
              <li>You engage in fraudulent or illegal activities</li>
              <li>Your account is inactive for an extended period</li>
              <li>We are required to do so by law</li>
              <li>We discontinue the Services</li>
            </ul>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              10.3 Effect of Termination
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Upon termination, your right to use the Services will immediately
              cease. We may delete your account and User Content, subject to our
              data retention obligations under Nigerian law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              11. Data Protection and Privacy
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Your privacy is important to us. Our collection, use, and
              protection of your personal information is governed by our Privacy
              Policy, which is incorporated into these Terms by reference.
            </p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              We follow the Nigeria Data Protection Act 2023 and
              regulations issued by the Nigeria Data Protection Commission
              (NDPC).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              12. Third-Party Services
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Kompleet may integrate with or link to third-party services,
              including:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Payment processors</li>
              <li>Cloud infrastructure providers</li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              We are not responsible for the content, privacy policies, or
              practices of any third-party services. Your use of third-party
              services is at your own risk and subject to their terms and
              conditions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              13. Dispute Resolution
            </h2>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              13.1 Informal Resolution
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              If you have any dispute with us, please contact us first at{" "}
              <a
                href="mailto:support@ivanotechnologies.com"
                className="text-primary hover:underline"
              >
                support@ivanotechnologies.com
              </a>{" "}
              to attempt to resolve the issue informally.
            </p>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              13.2 Governing Law
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              These Terms are governed by and construed in accordance with the
              laws of the Federal Republic of Nigeria, without regard to its
              conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              13.3 Jurisdiction
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Any legal action or proceeding arising out of or relating to these
              Terms shall be instituted in the courts of Nigeria, and you
              consent to the exclusive jurisdiction of such courts.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              14. General Provisions
            </h2>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              14.1 Entire Agreement
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              These Terms, together with our Privacy Policy, constitute the
              entire agreement between you and Ivano Technologies Ltd regarding
              the use of Kompleet.
            </p>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              14.2 Severability
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              If any provision of these Terms is found to be invalid or
              unenforceable, the remaining provisions will remain in full force
              and effect.
            </p>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              14.3 Waiver
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Our failure to enforce any right or provision of these Terms will
              not be considered a waiver of those rights.
            </p>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              14.4 Assignment
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              You may not assign or transfer these Terms or your account without
              our prior written consent. We may assign these Terms without
              restriction.
            </p>

            <h3 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">
              14.5 Force Majeure
            </h3>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              We will not be liable for any failure or delay in performance due
              to circumstances beyond our reasonable control, including acts of
              God, war, terrorism, riots, embargoes, acts of civil or military
              authorities, fire, floods, accidents, strikes, or shortages of
              transportation, facilities, fuel, energy, labor, or materials.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              15. Changes to Terms
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              We reserve the right to modify these Terms at any time. When we
              make changes, we will:
            </p>
            <ul className="list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2">
              <li>Update the "Last updated" date at the top of this page</li>
              <li>
                Notify you via email or through the platform (for material
                changes)
              </li>
              <li>Provide you with an opportunity to review the changes</li>
            </ul>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Your continued use of Kompleet after any changes constitutes your
              acceptance of the new Terms. If you do not agree to the modified
              Terms, you must stop using the Services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              16. Contact Information
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              {OPERATOR_LEGAL_NAME}, {OPERATOR_RC}, {OPERATOR_ADDRESS}. General
              contact:{" "}
              <a
                href={`mailto:${GENERAL_CONTACT_EMAIL}`}
                className="text-primary hover:underline"
              >
                {GENERAL_CONTACT_EMAIL}
              </a>
              . Support, refunds and payment disputes:{" "}
              <a
                href={`mailto:${DATA_PROTECTION_EMAIL}`}
                className="text-primary hover:underline"
              >
                {DATA_PROTECTION_EMAIL}
              </a>
              . Data protection requests:{" "}
              <a
                href={`mailto:${DATA_PROTECTION_EMAIL}`}
                className="text-primary hover:underline"
              >
                {DATA_PROTECTION_EMAIL}
              </a>{" "}
              with the subject &quot;Data request&quot;, for the attention of
              the Data Protection Officer, {OPERATOR_DPO}.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              17. Acknowledgment
            </h2>
            <p className="uppercase text-light-text-secondary dark:text-dark-text-secondary">
              By using Kompleet, you acknowledge that you have read, understood,
              and agree to be bound by these Terms of Service.
            </p>
          </section>
        </div>

          <div className="mt-12 pt-8 border-t border-light-border dark:border-dark-border">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
              © 2026 Ivano Technologies Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
