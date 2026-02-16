import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | KOMPLEET',
  description: 'Get in touch with the KOMPLEET team for support, partnerships, or inquiries.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-8 inline-block">&larr; Back to Home</Link>

        <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-4">Contact Us</h1>
        <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary mb-12">Have a question or need help? We would love to hear from you.</p>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8">
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-light-text-primary dark:text-dark-text-primary"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-light-text-primary dark:text-dark-text-primary"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Subject</label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-light-text-primary dark:text-dark-text-primary"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing &amp; Account</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent text-light-text-primary dark:text-dark-text-primary"
                    placeholder="How can we help you?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-800 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6">
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">Email Us</h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">General: <a href="mailto:info@ivanotechnologies.com" className="text-blue-600 hover:underline">info@ivanotechnologies.com</a></p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Support: <a href="mailto:support@ivanotechnologies.com" className="text-blue-600 hover:underline">support@ivanotechnologies.com</a></p>
            </div>
            <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6">
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">Office</h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Ivano Technologies Ltd<br />Lagos, Nigeria</p>
            </div>
            <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-6">
              <h3 className="font-semibold text-light-text-primary dark:text-dark-text-primary mb-3">Response Time</h3>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">We typically respond within 24 hours on business days.</p>
            </div>
          </div>
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
