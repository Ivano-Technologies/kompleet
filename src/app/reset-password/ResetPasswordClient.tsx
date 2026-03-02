'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';

type PageState = 'loading' | 'valid' | 'expired' | 'already_logged_in' | 'success' | 'error';

const headerLeftAddon = (
  <Link
    href="/login"
    className="flex items-center gap-2 text-sm text-white/90 drop-shadow-sm hover:text-white"
  >
    Back to Login
  </Link>
);

export default function ResetPasswordClient() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createBrowserClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session check error:', sessionError);
          setError('Failed to verify reset link. Please try again.');
          setPageState('error');
          return;
        }

        if (!session) {
          // No session means the reset link is invalid or expired
          setError('This reset link is invalid or has expired.');
          setPageState('expired');
          return;
        }

        // Check if this is a password recovery session
        // Supabase sets user.aud to 'authenticated' for regular sessions
        // and includes recovery metadata for password reset sessions
        const isRecoverySession = session.user.aud === 'authenticated';
        
        if (!isRecoverySession) {
          // User is already logged in with a regular session
          setPageState('already_logged_in');
          return;
        }

        // Valid password reset session
        setPageState('valid');
      } catch (err) {
        console.error('Unexpected error checking session:', err);
        setError('An unexpected error occurred. Please try again.');
        setPageState('error');
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const supabase = createBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        // Handle specific errors
        if (updateError.message.includes('same as the old password')) {
          setError('New password must be different from your old password');
        } else if (updateError.message.includes('weak')) {
          setError('Password is too weak. Please use a stronger password');
        } else {
          setError(updateError.message);
        }
        setLoading(false);
        return;
      }

      setPageState('success');
      setLoading(false);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Password update error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Success state
  if (pageState === 'success') {
    return (
      <AuthLayout headerLeftAddon={headerLeftAddon}>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Password Updated!</h1>
          <p className="text-sm text-text-3 dark:text-dark-text-3">
            Your password has been successfully reset. Redirecting to dashboard...
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Expired link state
  if (pageState === 'expired') {
    return (
      <AuthLayout headerLeftAddon={headerLeftAddon}>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Link Expired</h1>
          <p className="text-sm text-text-3 dark:text-dark-text-3">
            This password reset link has expired or is invalid. Reset links are valid for 1 hour.
          </p>
          <Link
            href="/forgot-password"
            className="block w-full rounded-md bg-accent py-3.5 text-center text-sm font-bold text-charcoal shadow-accent transition-all hover:bg-accent-hover"
          >
            Request New Reset Link
          </Link>
          <Link href="/login" className="text-sm text-text-3 hover:text-primary dark:text-dark-text-3">
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Already logged in state
  if (pageState === 'already_logged_in') {
    return (
      <AuthLayout headerLeftAddon={headerLeftAddon}>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <AlertCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Already Logged In</h1>
          <p className="text-sm text-text-3 dark:text-dark-text-3">
            You&apos;re already logged in. If you want to change your password, please go to Settings.
          </p>
          <Link
            href="/settings"
            className="block w-full rounded-md bg-accent py-3.5 text-center text-sm font-bold text-charcoal shadow-accent transition-all hover:bg-accent-hover"
          >
            Go to Settings
          </Link>
          <Link href="/dashboard" className="text-sm text-text-3 hover:text-primary dark:text-dark-text-3">
            Back to Dashboard
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <AuthLayout headerLeftAddon={headerLeftAddon}>
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Something Went Wrong</h1>
          <p className="text-sm text-text-3 dark:text-dark-text-3">
            {error || 'An unexpected error occurred. Please try again.'}
          </p>
          <Link
            href="/forgot-password"
            className="block w-full rounded-md bg-accent py-3.5 text-center text-sm font-bold text-charcoal shadow-accent transition-all hover:bg-accent-hover"
          >
            Request New Reset Link
          </Link>
          <Link href="/login" className="text-sm text-text-3 hover:text-primary dark:text-dark-text-3">
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Main form (loading or valid state)
  return (
    <AuthLayout headerLeftAddon={headerLeftAddon}>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <KeyRound className="h-7 w-7 text-accent" />
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Set New Password</h1>
        <p className="text-sm text-text-3 dark:text-dark-text-3">
          Enter your new password below. Make it strong and memorable.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-error/30 bg-error-bg p-3 text-sm text-error dark:bg-error-darkBg dark:text-error-dark">
          {error}
        </div>
      )}

      {pageState === 'loading' ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-text-3 dark:text-dark-text-3">Verifying reset link...</p>
        </div>
      ) : pageState === 'valid' ? (
        <form onSubmit={handleSubmit} className="space-y-5">
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
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full rounded-md border-2 border-border bg-surface p-3 pr-10 text-sm text-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-1"
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
            <p className="mt-1 text-xs text-text-4 dark:text-dark-text-4">
              Use a mix of letters, numbers, and symbols for better security
            </p>
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
              minLength={6}
              placeholder="Re-enter your password"
              className="mt-2 w-full rounded-md border-2 border-border bg-surface p-3 text-sm text-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-1"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full transform rounded-md bg-accent py-3.5 text-sm font-bold text-charcoal shadow-accent transition-all hover:-translate-y-0.5 hover:bg-accent-hover disabled:opacity-50 disabled:transform-none"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      ) : null}

      <p className="mt-6 text-center text-xs text-text-4 dark:text-dark-text-4">
        Your password will be encrypted and stored securely.
      </p>
    </AuthLayout>
  );
}
