import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Careers | KOMPLEET',
  description: 'Join the KOMPLEET team and help build the future of financial management for Nigerian businesses.',
};

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-8 inline-block">&larr; Back to Home</Link>

        <div className="bg-white rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Careers at KOMPLEET</h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            We are building the future of financial management for Nigerian SMEs. If you are passionate about technology, fintech, and making a real impact in Africa, we want to hear from you.
          </p>
        </div>

        <div className="bg-white rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Our Culture</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Mission-Driven</h3>
              <p className="text-sm text-gray-600">Everything we build serves Nigerian SMEs. Impact is our north star.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Remote-Friendly</h3>
              <p className="text-sm text-gray-600">Work from anywhere in Nigeria. We value output over hours.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Continuous Learning</h3>
              <p className="text-sm text-gray-600">We invest in growth through knowledge sharing and mentorship.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Ownership</h3>
              <p className="text-sm text-gray-600">Everyone has a stake in our success and the autonomy to drive results.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Open Positions</h2>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">
              We do not have any open positions at the moment, but we are always looking for talented people.
            </p>
            <p className="text-gray-600">
              Send your CV and a brief introduction to{' '}
              <a href="mailto:careers@techivano.com" className="text-blue-600 hover:underline">careers@techivano.com</a>
              {' '}and we will reach out when a role that fits your skills opens up.
            </p>
          </div>
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
