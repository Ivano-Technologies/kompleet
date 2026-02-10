import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | KOMPLEET',
  description: 'Privacy Policy for KOMPLEET - Nigerian Tax Compliance Platform',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last updated: February 6, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to KOMPLEET ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Nigerian tax compliance platform.
            </p>
            <p className="text-gray-700">
              By using KOMPLEET, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-700 mb-4">
              We collect personal information that you voluntarily provide to us when you register on the platform, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Name and contact information (email address, phone number)</li>
              <li>Account credentials (username, password)</li>
              <li>Tax identification numbers (TIN)</li>
              <li>Business information (company name, registration number, business type)</li>
              <li>Financial information necessary for tax calculations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Authentication Information</h3>
            <p className="text-gray-700 mb-4">
              When you sign in using third-party authentication services (such as Google OAuth), we receive:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Your name and email address from your Google account</li>
              <li>Profile picture (if available)</li>
              <li>Unique identifier from the authentication provider</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Usage Data</h3>
            <p className="text-gray-700 mb-4">
              We automatically collect certain information when you visit, use, or navigate our platform:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and preferences</li>
              <li>Tax calculation history and saved reports</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect or receive to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Provide, operate, and maintain our tax compliance services</li>
              <li>Process your tax calculations and generate reports</li>
              <li>Manage your account and provide customer support</li>
              <li>Send you updates, notifications, and administrative information</li>
              <li>Improve and personalize your experience on our platform</li>
              <li>Comply with Nigerian tax laws and regulatory requirements</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Analyze usage patterns to enhance our services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Storage and Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Data is encrypted in transit using SSL/TLS protocols</li>
              <li>Sensitive data is encrypted at rest in our secure databases</li>
              <li>Access to personal information is restricted to authorized personnel only</li>
              <li>We use industry-standard authentication and authorization mechanisms</li>
              <li>Regular security audits and vulnerability assessments are conducted</li>
            </ul>
            <p className="text-gray-700">
              Your data is stored on secure servers provided by Supabase, a trusted cloud infrastructure provider that complies with international security standards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Service Providers:</strong> With trusted third-party vendors who assist us in operating our platform (e.g., hosting, analytics, authentication services)</li>
              <li><strong>Legal Requirements:</strong> When required by law or in response to valid requests by public authorities (e.g., Nigerian tax authorities, law enforcement)</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition of all or a portion of our business</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Privacy Rights</h2>
            <p className="text-gray-700 mb-4">
              Under Nigerian data protection laws (Nigeria Data Protection Act 2023), you have the following rights:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Objection:</strong> Object to the processing of your personal information</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a structured format</li>
              <li><strong>Withdraw Consent:</strong> Withdraw your consent at any time</li>
            </ul>
            <p className="text-gray-700">
              To exercise any of these rights, please contact us at <a href="mailto:privacy@techivano.com" className="text-blue-600 hover:underline">privacy@techivano.com</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your personal information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Provide our services to you</li>
              <li>Comply with legal obligations (Nigerian tax records must be retained for at least 6 years)</li>
              <li>Resolve disputes and enforce our agreements</li>
            </ul>
            <p className="text-gray-700">
              When we no longer need your information, we will securely delete or anonymize it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Maintain your session and keep you logged in</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze how you use our platform</li>
              <li>Improve our services and user experience</li>
            </ul>
            <p className="text-gray-700">
              You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              Our platform integrates with third-party services, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Google OAuth:</strong> For authentication services</li>
              <li><strong>Supabase:</strong> For database and authentication infrastructure</li>
              <li><strong>Vercel:</strong> For hosting and deployment</li>
            </ul>
            <p className="text-gray-700">
              These third parties have their own privacy policies, and we encourage you to review them. We are not responsible for the privacy practices of these external services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700">
              KOMPLEET is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Posting the updated policy on this page</li>
              <li>Updating the "Last updated" date</li>
              <li>Sending you an email notification (for significant changes)</li>
            </ul>
            <p className="text-gray-700">
              Your continued use of KOMPLEET after any changes indicates your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 mb-2"><strong>Ivano Technologies Ltd</strong></p>
              <p className="text-gray-700 mb-2">Email: <a href="mailto:privacy@techivano.com" className="text-blue-600 hover:underline">privacy@techivano.com</a></p>
              <p className="text-gray-700 mb-2">Support: <a href="mailto:support@techivano.com" className="text-blue-600 hover:underline">support@techivano.com</a></p>
              <p className="text-gray-700">Location: Nigeria</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-700">
              This Privacy Policy is governed by and construed in accordance with the laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act 2023 and regulations issued by the Nigeria Data Protection Commission (NDPC).
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            © 2026 Ivano Technologies Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
