import type { Metadata } from "next";
import Link from "next/link";
import {
  DATA_PROTECTION_EMAIL,
  OPERATOR_ADDRESS,
  OPERATOR_LEGAL_NAME,
  OPERATOR_RC,
} from "@/lib/legal";

const HEADING =
  "text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4";
const BODY = "text-light-text-secondary dark:text-dark-text-secondary mb-4";
const LIST =
  "list-disc pl-6 text-light-text-secondary dark:text-dark-text-secondary mb-4 space-y-2";

export const metadata: Metadata = {
  alternates: { canonical: "/cookies" },
  title: "Kompleet: Cookie Notice",
  description:
    "Cookie Notice for Kompleet: how we use cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div data-marketing className="min-h-screen bg-bg dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-light-surface dark:bg-dark-surface rounded-lg p-8">
        <Link
          href="/"
          className="text-sm text-primary hover:underline mb-8 inline-block"
        >
          &larr; Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
          Cookie Notice
        </h1>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-8">
          Last updated: 13 November 2026
        </p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <p className={BODY}>
              Kompleet uses a small number of cookies and similar storage. This
              notice explains what they are. The banner shown on the site lets
              you accept or decline the optional ones, and &quot;Cookie
              settings&quot; in the footer reopens your choices at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className={HEADING}>Storage we use</h2>
            <ul className={LIST}>
              <li>
                <strong>Essential (always on).</strong> Cookies and local
                storage that keep you signed in, remember security tokens, and
                route traffic. Kompleet cannot work without these. Set by
                Kompleet, by Convex (our application platform, which keeps your
                sign in token in local storage) and by Vercel, our hosting
                provider.
              </li>
              <li>
                <strong>Your cookie choice.</strong> Your accept or decline
                choice is stored in local storage on your device, so we do not
                ask on every visit. It is not a cookie.
              </li>
              <li>
                <strong>Error tracking.</strong> We use Sentry to detect and
                fix errors. Sentry keeps a session storage entry on your device
                and, when an error occurs, may record a replay of the session
                with text and inputs masked, so we can see what went wrong
                without seeing what you typed.
              </li>
              <li>
                <strong>Analytics (optional, off unless you accept).</strong>{" "}
                Kompleet includes Google Analytics, which loads and sets
                cookies only after you accept optional cookies, and only when a
                measurement ID is configured for the site. No measurement ID is
                configured at present, so no analytics cookies are set today.
                We will update this notice before analytics is switched on.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className={HEADING}>What we do not use</h2>
            <p className={BODY}>
              We do not use advertising cookies. If we add any other optional
              storage, we will update this notice and ask for your consent
              before it is set.
            </p>
          </section>

          <section className="mb-8">
            <h2 className={HEADING}>Managing cookies</h2>
            <p className={BODY}>
              You can also block or delete cookies in your browser settings.
              Blocking the essential cookies will sign you out and stop
              Kompleet from working.
            </p>
            <p className={BODY}>
              Questions:{" "}
              <a
                href={`mailto:${DATA_PROTECTION_EMAIL}`}
                className="text-primary hover:underline"
              >
                {DATA_PROTECTION_EMAIL}
              </a>
              . {OPERATOR_LEGAL_NAME}, {OPERATOR_RC}, {OPERATOR_ADDRESS}.
            </p>
          </section>
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
