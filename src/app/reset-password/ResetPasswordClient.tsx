'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthActions } from '@convex-dev/auth/react';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';

const headerLeftAddon = (
  <Link
    href="/login"
    className="flex items-center gap-2 text-sm text-text-3 hover:text-text-1"
  >
    Back to Login
  </Link>
);

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuthActions();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8 || !/\d/.test(password)) {
      setError('Password must be at least 8 characters and include a number');
      setLoading(false);
      return;
    }

    try {
      await signIn('password', {
        email,
        code,
        newPassword: password,
        flow: 'reset-verification',
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid or expired code. Request a new reset.',
      );
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout variant="dark-split" headerLeftAddon={headerLeftAddon}>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Password Updated!</h1>
          <p className="text-sm text-text-3 dark:text-dark-text-3">
            Your password has been reset. Redirecting to dashboard...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="dark-split" headerLeftAddon={headerLeftAddon}>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <KeyRound className="h-7 w-7 text-accent" />
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Set New Password</h1>
        <p className="text-sm text-text-3 dark:text-dark-text-3">
          Enter the 8-digit code from your email and choose a new password.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-error/30 bg-error-bg p-3 text-sm text-error dark:bg-error-darkBg dark:text-error-dark">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2 h-[52px] w-full rounded-md border border-border bg-surface px-4 text-sm text-text-1 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="code" className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
            Reset code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            minLength={6}
            placeholder="8-digit code"
            className="mt-2 h-[52px] w-full rounded-md border border-border bg-surface px-4 text-sm text-text-1 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
            New Password
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="h-[52px] w-full rounded-md border border-border bg-surface px-4 pr-11 text-sm text-text-1 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-3 hover:text-text-1 dark:text-dark-text-3 dark:hover:text-dark-text-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Re-enter your password"
            className="mt-2 h-[52px] w-full rounded-md border border-border bg-surface px-4 text-sm text-text-1 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-6 h-[52px] w-full rounded-md bg-accent text-sm font-bold text-charcoal hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
