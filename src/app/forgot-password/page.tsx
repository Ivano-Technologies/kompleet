'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';

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
        redirectTo: `${window.location.origin}/auth/callback?redirect=/reset-password`,
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
      <AuthLayout variant="dark-split">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Mail className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Check Your Email</h1>
          <p className="text-sm text-text-3 dark:text-dark-text-3">
            We&apos;ve sent a password reset link to <strong className="text-text-1 dark:text-dark-text-1">{email}</strong>
          </p>
          <Link
            href="/login"
            className="block w-full rounded-md bg-accent py-3.5 text-center text-sm font-bold text-charcoal shadow-accent transition-all hover:bg-accent-hover"
          >
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      variant="dark-split"
      headerLeftAddon={
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-text-3 hover:text-text-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
      }
    >
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <KeyRound className="h-7 w-7 text-accent" />
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Reset your password</h1>
        <p className="text-sm text-text-3 dark:text-dark-text-3">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-error/30 bg-error-bg p-3 text-sm text-error dark:bg-error-darkBg dark:text-error-dark">
          {error}
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-5">
        <div>
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@company.com"
            className="mt-2 h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm text-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:text-dark-text-1"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-6 h-[52px] w-full rounded-xl bg-accent text-sm font-bold text-charcoal shadow-accent transition-all hover:-translate-y-0.5 hover:bg-accent-hover disabled:opacity-50 disabled:transform-none"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-text-4 dark:text-dark-text-4">
        Secure link expires in 60 minutes for your protection.
      </p>
    </AuthLayout>
  );
}
