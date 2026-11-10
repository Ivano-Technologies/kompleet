import type { Metadata } from "next";
import Link from "next/link";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookie-consent";
import { DSR_EMAIL } from "@/lib/legal";

const COOKIE_LINK = "text-primary underline underline-offset-2";

type StorageRow = {
  name: string;
  purpose: string;
  duration: string;
};

const STORAGE_ROWS: StorageRow[] = [
  {
    name: "__Host-__convexAuthJWT",
    purpose:
      "Cookie. Convex Auth session token. Keeps you signed in. HttpOnly. Strictly necessary. On localhost the name is __convexAuthJWT.",
    duration:
      "Session (until the browser session ends or you sign out). No max-age is configured.",
  },
  {
    name: "__Host-__convexAuthRefreshToken",
    purpose:
      "Cookie. Convex Auth refresh token. Strictly necessary. On localhost the name is __convexAuthRefreshToken.",
    duration:
      "Session (until the browser session ends or you sign out). No max-age is configured.",
  },
  {
    name: "__convexAuthServerStateFetchTime_*",
    purpose:
      "Local storage. Convex Auth sync timestamp for the current deployment. Strictly necessary. No consent needed.",
    duration: "Until you sign out or clear site data",
  },
  {
    name: "sentryReplaySession",
    purpose:
      "Session storage. Sentry replay buffer so the last ~60 seconds can be uploaded if an error occurs. Functional / strictly necessary for error diagnostics. No consent needed.",
    duration: "Until the tab closes",
  },
  {
    name: "kompleet-theme",
    purpose:
      "Local storage. Remembers light, dark, or system theme. Functional. No consent needed.",
    duration: "Until you change theme or clear site data",
  },
  {
    name: "kompleet_selected_year",
    purpose:
      "Local storage. Remembers the selected tax year in the dashboard. Functional. No consent needed.",
    duration: "Until you change the year or clear site data",
  },
  {
    name: COOKIE_CONSENT_STORAGE_KEY,
    purpose:
      "Local storage. Stores your analytics-cookie choice (granted or denied). The banner defaults to deny and does not set cookies before you choose.",
    duration: "Until you change Cookie settings or clear site data",
  },
  {
    name: "_ga, _ga_*",
    purpose:
      "Google Analytics cookies, set only if you accept in the banner and a measurement ID is configured. They are not set today: no measurement ID is configured.",
    duration:
      "Only if GA is enabled; then according to Google's cookie durations",
  },
];

function StorageInventory({ rows }: { rows: StorageRow[] }) {
  return (
    <>
      <ul className="mb-4 space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={row.name}
            className="rounded-md border border-light-border p-3 dark:border-dark-border"
          >
            <p className="font-mono text-xs break-all text-light-text-primary dark:text-dark-text-primary">
              {row.name}
            </p>
            <p className="mt-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
              <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                Purpose.{" "}
              </span>
              {row.purpose}
            </p>
            <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">
              <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                Duration.{" "}
              </span>
              {row.duration}
            </p>
          </li>
        ))}
      </ul>
      <div className="mb-4 hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm text-light-text-secondary dark:text-dark-text-secondary">
          <thead>
            <tr>
              <th className="border-b border-light-border py-2 pr-4 font-semibold text-light-text-primary dark:border-dark-border dark:text-dark-text-primary">
                Name
              </th>
              <th className="border-b border-light-border py-2 pr-4 font-semibold text-light-text-primary dark:border-dark-border dark:text-dark-text-primary">
                Purpose
              </th>
              <th className="border-b border-light-border py-2 font-semibold text-light-text-primary dark:border-dark-border dark:text-dark-text-primary">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const cellBorder =
                index === rows.length - 1
                  ? "py-2 align-top"
                  : "border-b border-light-border py-2 align-top dark:border-dark-border";
              return (
                <tr key={row.name}>
                  <td className={`${cellBorder} pr-4 font-mono text-xs`}>
                    {row.name}
                  </td>
                  <td className={`${cellBorder} pr-4`}>{row.purpose}</td>
                  <td className={cellBorder}>{row.duration}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

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
          Last updated 10 Nov 2026
        </p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              1. What Are Cookies
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Cookies are small text files placed on your device when you visit
              a website. Kompleet also uses the browser&apos;s local storage and
              session storage for a few first-party items. This page lists what
              Kompleet actually sets.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">
              2. Cookies and storage we set
            </h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">
              Essential authentication cookies and the functional storage below
              are required for the product to work. They do not need cookie
              consent. Theme, selected tax year, Convex Auth sync time, and the
              Sentry replay session buffer are strictly necessary or functional.
              We do not set Vercel analytics cookies or Sentry cookies. We do
              not store a locale cookie or a dashboard-layout cookie.
            </p>

            <StorageInventory rows={STORAGE_ROWS} />
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
