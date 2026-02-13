import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | KOMPLEET',
  description: 'Cookie Policy for KOMPLEET - how we use cookies and similar technologies.',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg p-8">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-8 inline-block">&larr; Back to Home</Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: February 12, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies</h2>
            <p className="text-gray-700 mb-4">
              Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the website owners.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Cookies</h2>
            <p className="text-gray-700 mb-4">KOMPLEET uses cookies for the following purposes:</p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Essential Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies are required for the platform to function. They enable core features such as authentication, session management, and security. You cannot opt out of essential cookies.
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Authentication tokens:</strong> Keep you signed in securely</li>
              <li><strong>Session cookies:</strong> Maintain your session state as you navigate</li>
              <li><strong>CSRF tokens:</strong> Protect against cross-site request forgery</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Functional Cookies</h3>
            <p className="text-gray-700 mb-4">
              These cookies remember your preferences and settings to provide a personalized experience:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Theme preference (light/dark mode)</li>
              <li>Language and locale settings</li>
              <li>Dashboard layout preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Analytics Cookies</h3>
            <p className="text-gray-700 mb-4">
              We use analytics to understand how visitors interact with our platform, helping us improve the user experience. Analytics data is aggregated and anonymized.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Third-Party Cookies</h2>
            <p className="text-gray-700 mb-4">
              Some cookies are placed by third-party services we use:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Supabase:</strong> Authentication and session management</li>
              <li><strong>Vercel:</strong> Performance monitoring and analytics</li>
              <li><strong>Sentry:</strong> Error tracking and reporting</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Managing Cookies</h2>
            <p className="text-gray-700 mb-4">
              You can control cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>View what cookies are stored and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific sites</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
            <p className="text-gray-700">
              Please note that disabling essential cookies will prevent you from using KOMPLEET, as they are required for authentication and security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Updates to This Policy</h2>
            <p className="text-gray-700">
              We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated date. Your continued use of KOMPLEET after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact</h2>
            <p className="text-gray-700">
              If you have questions about our use of cookies, contact us at{' '}
              <a href="mailto:privacy@techivano.com" className="text-blue-600 hover:underline">privacy@techivano.com</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            &copy; 2026 Ivano Technologies Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
