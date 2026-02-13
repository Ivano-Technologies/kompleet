import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | KOMPLEET',
  description: 'Learn about KOMPLEET - the financial operating system built for Nigerian SMEs.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-8 inline-block">&larr; Back to Home</Link>

        <div className="bg-white rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About KOMPLEET</h1>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            KOMPLEET is the financial operating system built specifically for Nigerian small and medium enterprises. We believe that every business deserves access to professional-grade financial tools, regardless of size.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Our platform automates tax compliance, invoicing, and financial reporting so business owners can focus on growth instead of paperwork. Built with deep understanding of the Nigerian regulatory landscape, KOMPLEET handles FIRS and LIRS requirements out of the box.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed">
              To simplify financial management and tax compliance for Nigerian businesses, making it accessible, affordable, and automated. We aim to eliminate the friction between businesses and their regulatory obligations.
            </p>
          </div>
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Vision</h2>
            <p className="text-gray-700 leading-relaxed">
              A Nigeria where every SME operates with full financial clarity and tax compliance, powered by technology that works behind the scenes so entrepreneurs can focus on building.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Why Nigeria?</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            Nigeria is home to over 40 million SMEs, contributing more than 48% of GDP and employing over 80% of the workforce. Yet most businesses struggle with manual tax compliance processes, leading to penalties, missed deadlines, and lost productivity.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Existing financial tools were not designed for the Nigerian context — different tax codes, Naira-specific calculations, FIRS/LIRS filing requirements, and multi-currency invoicing needs. KOMPLEET was built from the ground up to address these challenges.
          </p>
        </div>

        <div className="bg-white rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Built By</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-2"><strong>Ivano Technologies Ltd</strong></p>
            <p className="text-gray-600 text-sm">A technology company focused on building tools that solve real problems for African businesses.</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to get started?</h3>
          <p className="text-gray-600 mb-4">Join thousands of Nigerian businesses using KOMPLEET.</p>
          <Link
            href="/signup"
            className="inline-block bg-green-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-800 transition-colors"
          >
            Create Free Account
          </Link>
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
