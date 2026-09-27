'use client';

import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import {
  AUTH_ERROR,
  AUTH_FORM,
  AUTH_INPUT,
  AUTH_LABEL,
  AUTH_SUBMIT,
  AUTH_SUBTITLE,
  AUTH_TITLE,
} from '@/components/layout/auth-density';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signIn } = useAuthActions();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn('password', { email, flow: 'reset' });
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
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h1 className={AUTH_TITLE}>Check Your Email</h1>
          <p className={AUTH_SUBTITLE}>
            If an account exists for <strong className="text-text-1 dark:text-dark-text-1">{email}</strong>, we sent an 8-digit reset code.
          </p>
          <Link
            href={`/reset-password?email=${encodeURIComponent(email)}`}
            className="block w-full rounded-md bg-accent py-2.5 text-center text-sm font-bold text-charcoal hover:bg-accent-hover"
          >
            Enter reset code
          </Link>
          <Link href="/login" className="text-xs text-text-3 hover:text-primary">
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
          className="flex items-center gap-1.5 text-xs text-text-3 hover:text-text-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
        </Link>
      }
    >
      <div className="mb-3 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <h1 className={AUTH_TITLE}>Reset your password</h1>
        <p className={AUTH_SUBTITLE}>
          Enter your email and we&apos;ll send an 8-digit code to reset your password.
        </p>
      </div>

      {error && (
        <div className={AUTH_ERROR}>
          {error}
        </div>
      )}

      <form onSubmit={handleResetPassword} className={AUTH_FORM}>
        <div>
          <label htmlFor="email" className={AUTH_LABEL}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@company.com"
            className={AUTH_INPUT}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={AUTH_SUBMIT}
        >
          {loading ? 'Sending...' : 'Send Reset Code'}
        </button>
      </form>

      <p className="mt-3 text-center text-[11px] text-text-4 dark:text-dark-text-4">
        The code expires in 15 minutes. Existing users can also reclaim by signing up with the same email.
      </p>
    </AuthLayout>
  );
}
