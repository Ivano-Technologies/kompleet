import type { Metadata } from "next";
import Link from "next/link";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookie-consent";
import { DSR_EMAIL } from "@/lib/legal";

const COOKIE_LINK = "text-primary underline underline-offset-2";

export const metadata: Metadata = {
  alternates: { canonical: "/cookies" },
  title: "Kompleet: Cookie Policy",
  description:
    "Cookie Policy for Kompleet: how we use cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div data-marketing className="min-h-screen bg-bg dark:bg-dark-bg py-12 px-4 sm:px-6 lg:px-8">
      <SkipToContent />
      <main id="main-content" className="max-w-4xl mx-auto bg-light-surface dark:bg-dark-surface rounded-lg p-8">
        <Link
          href="/"
          className={`mb-8 inline-flex min-h-11 items-center text-sm ${COOKIE_LINK}`}
        >
          &larr; Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">
          Cookie Policy
        </h1>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-8">
          Last updated: 10 November 2026
        </p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              1. What Are Cookies
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Cookies are small text files placed on your device when you visit
              a website. Kompleet also uses the browser&apos;s local storage for
              a few first-party preferences. This page lists only what Kompleet
              actually sets.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              2. Cookies and storage we set
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Essential authentication cookies are required to keep you signed
              in. Theme and consent are stored in local storage, not cookies.
              We do not set Vercel analytics cookies or Sentry cookies. We do
              not store a locale cookie or a dashboard-layout cookie.
            </p>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-left text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <thead>
                  <tr>
                    <th className="border-b border-light-border dark:border-dark-border py-2 pr-4 font-semibold text-light-text-primary dark:text-dark-text-primary">
                      Name
                    </th>
                    <th className="border-b border-light-border dark:border-dark-border py-2 pr-4 font-semibold text-light-text-primary dark:text-dark-text-primary">
                      Purpose
                    </th>
                    <th className="border-b border-light-border dark:border-dark-border py-2 font-semibold text-light-text-primary dark:text-dark-text-primary">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top font-mono text-xs">
                      __Host-__convexAuthJWT
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top">
                      Convex Auth session token. Keeps you signed in. HttpOnly.
                      On localhost the name is{" "}
                      <span className="font-mono text-xs">__convexAuthJWT</span>.
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 align-top">
                      Session (until the browser session ends or you sign out).
                      No max-age is configured.
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top font-mono text-xs">
                      __Host-__convexAuthRefreshToken
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top">
                      Convex Auth refresh token. On localhost the name is{" "}
                      <span className="font-mono text-xs">
                        __convexAuthRefreshToken
                      </span>
                      .
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 align-top">
                      Session (until the browser session ends or you sign out).
                      No max-age is configured.
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top font-mono text-xs">
                      kompleet-theme
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top">
                      Local storage. Remembers light, dark, or system theme.
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 align-top">
                      Until you change theme or clear site data
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top font-mono text-xs">
                      {COOKIE_CONSENT_STORAGE_KEY}
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 pr-4 align-top">
                      Local storage. Stores your analytics-cookie choice
                      (granted or denied). The banner defaults to deny and does
                      not set cookies before you choose.
                    </td>
                    <td className="border-b border-light-border dark:border-dark-border py-2 align-top">
                      Until you change Cookie settings or clear site data
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 align-top font-mono text-xs">
                      _ga, _ga_*
                    </td>
                    <td className="py-2 pr-4 align-top">
                      Google Analytics cookies, set only if you accept in the
                      banner and a measurement ID is configured. They are not
                      set today: no measurement ID is configured.
                    </td>
                    <td className="py-2 align-top">
                      Only if GA is enabled; then according to Google&apos;s
                      cookie durations
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              3. Managing Cookies
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Decline and Accept on the cookie banner have equal weight. You can
              change the analytics choice later from Cookie settings in the
              footer. You can also control cookies in your browser. Blocking the
              Convex Auth cookies will sign you out, because they are required
              to stay logged in.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              4. Updates to This Policy
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              We may update this Cookie Policy from time to time. Changes will
              be posted on this page with an updated date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              5. Contact
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              If you have questions about our use of cookies, contact us at{" "}
              <a href={`mailto:${DSR_EMAIL}`} className={COOKIE_LINK}>
                {DSR_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-light-border dark:border-dark-border">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary text-center">
            &copy; 2026 Ivano Technologies Ltd. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
