'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background p-6">
        <div className="w-full max-w-md">
          <div className="solid-card bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border p-8 rounded-xl text-center">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Check Your Email</h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
              We've sent a password reset link to <strong className="text-light-text-primary dark:text-dark-text-primary">{email}</strong>
            </p>
            <Link 
              href="/login"
              className="btn-primary block w-full text-center py-3"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background p-6">
      <div className="w-full max-w-md">
        {/* Logo - Top Left in Dark Mode, Centered in Light Mode */}
        <div className="mb-8 dark:mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">KOMPLEET</span>
          </Link>
        </div>

        {/* Back to Login - Top Right in Dark Mode */}
        <div className="hidden dark:block absolute top-6 right-6">
          <Link 
            href="/login" 
            className="text-sm text-dark-text-secondary hover:text-primary-500 transition-colors"
          >
            Back to Login
          </Link>
        </div>

        {/* Card - Solid Design */}
        <div className="solid-card bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border p-8 rounded-xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center">
              <span className="material-icons text-primary-500 text-3xl">lock_reset</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2 text-center dark:text-left">
            <span className="dark:hidden">Reset your password</span>
            <span className="hidden dark:inline">Forgot password?</span>
          </h1>
          
          {/* Description */}
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6 text-center dark:text-left">
            <span className="dark:hidden">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </span>
            <span className="hidden dark:inline">
              Enter the email address associated with your KOMPLEET account and we'll send you a link to reset your password.
            </span>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-error-500/10 border border-error-500/20 rounded-lg">
              <p className="text-error-500 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-light-text-secondary dark:text-primary-500 mb-2 dark:uppercase"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-light-surface-hover dark:bg-dark-surface-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="name@company.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed dark:uppercase"
            >
              {loading ? 'Sending...' : (
                <>
                  <span className="dark:hidden">Send reset link</span>
                  <span className="hidden dark:inline">Send Reset Link</span>
                </>
              )}
            </button>
          </form>

          {/* Helper Text - Dark Mode Only */}
          <div className="hidden dark:block mt-6 space-y-3">
            <div className="flex items-start gap-2 text-sm text-dark-text-tertiary">
              <span className="material-icons text-primary-500 text-lg mt-0.5">schedule</span>
              <p>Secure link expires in 60 minutes for your protection.</p>
            </div>
            <div className="flex items-start gap-2 text-sm text-dark-text-tertiary">
              <span className="material-icons text-primary-500 text-lg mt-0.5">support_agent</span>
              <p>
                Need help? Contact our support team at{' '}
                <a href="mailto:support@kompleet.ng" className="text-primary-500 hover:text-primary-400 transition-colors">
                  support@kompleet.ng
                </a>
              </p>
            </div>
          </div>

          {/* Back to Login - Light Mode Only */}
          <div className="dark:hidden mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-light-text-secondary hover:text-primary-500 transition-colors inline-flex items-center gap-1"
            >
              <span className="material-icons text-sm">arrow_back</span>
              Back to login
            </Link>
          </div>
        </div>

        {/* Footer Links - Light Mode */}
        <div className="dark:hidden mt-6 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-light-text-tertiary">
            <Link href="/privacy" className="hover:text-primary-500 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary-500 transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-primary-500 transition-colors">
              Contact Support
            </Link>
          </div>
        </div>

        {/* Footer Links - Dark Mode */}
        <div className="hidden dark:block mt-6 text-center">
          <div className="flex items-center justify-center gap-6 text-xs text-dark-text-tertiary uppercase font-medium">
            <Link href="/privacy" className="hover:text-primary-500 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary-500 transition-colors">
              Terms of Service
            </Link>
            <Link href="/security" className="hover:text-primary-500 transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
