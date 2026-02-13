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
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-background">
        <div className="w-full max-w-md p-8">
          <div className="solid-card bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border p-8 text-center">
            <div className="w-16 h-16 bg-success-light/20 dark:bg-success-dark/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success-light dark:text-success-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Check Your Email</h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
              We've sent a password reset link to <strong className="text-light-text-primary dark:text-dark-text-primary">{email}</strong>
            </p>
            <Link 
              href="/login"
              className="btn-primary block w-full text-center"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-background">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <span className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">KOMPLEET</span>
            </div>
          </Link>
        </div>

        {/* Card - Solid Design (Light + Dark) */}
        <div className="solid-card bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border p-8">
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Reset Password</h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-dark-surface-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <div className="p-3 bg-error-light/10 dark:bg-error-dark/10 border border-error-light/20 dark:border-error-dark/20 rounded-lg">
                <p className="text-error-light dark:text-error-dark text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-primary-500 transition-colors inline-flex items-center gap-1"
            >
              <span className="material-icons text-sm">arrow_back</span>
              Back to Sign In
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 pt-6 border-t border-light-border dark:border-dark-border">
            <div className="flex items-center justify-center gap-4 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              <div className="flex items-center gap-1">
                <span className="material-icons text-sm">security</span>
                <span>NDPR Compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-icons text-sm">lock</span>
                <span>256-bit SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
