import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | KOMPLEET',
  description: 'Learn about KOMPLEET - the financial operating system built for Nigerian SMEs.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-8 inline-block">&larr; Back to Home</Link>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">About KOMPLEET</h1>
          <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary mb-6 leading-relaxed">
            KOMPLEET is the financial operating system built specifically for Nigerian small and medium enterprises. We believe that every business deserves access to professional-grade financial tools, regardless of size.
          </p>
          <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
            Our platform automates tax compliance, invoicing, and financial reporting so business owners can focus on growth instead of paperwork. Built with deep understanding of the Nigerian regulatory landscape, KOMPLEET handles NRS and JTB requirements out of the box.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Our Mission</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
              To simplify financial management and tax compliance for Nigerian businesses, making it accessible, affordable, and automated. We aim to eliminate the friction between businesses and their regulatory obligations.
            </p>
          </div>
          <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Our Vision</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
              A Nigeria where every SME operates with full financial clarity and tax compliance, powered by technology that works behind the scenes so entrepreneurs can focus on building.
            </p>
          </div>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">Why Nigeria?</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4 leading-relaxed">
            Nigeria is home to over 40 million SMEs, contributing more than 48% of GDP and employing over 80% of the workforce. Yet most businesses struggle with manual tax compliance processes, leading to penalties, missed deadlines, and lost productivity.
          </p>
          <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
            Existing financial tools were not designed for the Nigerian context — different tax codes, Naira-specific calculations, NRS/JTB filing requirements, and multi-currency invoicing needs. KOMPLEET was built from the ground up to address these challenges.
          </p>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-6">Built By</h2>
          <div className="bg-light-background dark:bg-dark-background p-6 rounded-lg">
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-2"><strong>Ivano Technologies Ltd</strong></p>
            <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">A technology company focused on building tools that solve real problems for African businesses.</p>
          </div>
        </div>

        <div className="bg-light-surface dark:bg-dark-surface rounded-lg p-8 text-center">
          <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">Ready to get started?</h3>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">Join thousands of Nigerian businesses using KOMPLEET.</p>
          <Link
            href="/signup"
            className="inline-block bg-green-700 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-800 transition-colors"
          >
            Create Free Account
          </Link>
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
