'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Moon, Sun } from 'lucide-react';

const LOGO_URL =
  '/assets/logo-primary.png';

type PageState = 'loading' | 'valid' | 'expired' | 'already_logged_in' | 'success' | 'error';

export default function ResetPasswordClient() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

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
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-[rgba(var(--primary-rgb),0.15)] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-[rgb(var(--primary))]" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Password Updated!</h1>
          <p className="text-[rgb(var(--text-secondary))]">
            Your password has been successfully reset. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Expired link state
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Link Expired</h1>
          <p className="text-[rgb(var(--text-secondary))]">
            This password reset link has expired or is invalid. Reset links are valid for 1 hour.
          </p>
          <Link href="/forgot-password" className="btn-primary block w-full text-center py-3">
            Request New Reset Link
          </Link>
          <Link href="/login" className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // Already logged in state
  if (pageState === 'already_logged_in') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-[rgba(var(--primary-rgb),0.15)] rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-[rgb(var(--primary))]" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Already Logged In</h1>
          <p className="text-[rgb(var(--text-secondary))]">
            You're already logged in. If you want to change your password, please go to Settings.
          </p>
          <Link href="/settings" className="btn-primary block w-full text-center py-3">
            Go to Settings
          </Link>
          <Link href="/dashboard" className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Something Went Wrong</h1>
          <p className="text-[rgb(var(--text-secondary))]">
            {error || 'An unexpected error occurred. Please try again.'}
          </p>
          <Link href="/forgot-password" className="btn-primary block w-full text-center py-3">
            Request New Reset Link
          </Link>
          <Link href="/login" className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // Main form (loading or valid state)
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-6">
        <Link href="/login" className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
          Back to Login
        </Link>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      {/* Centered form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image src={LOGO_URL} alt="KOMPLEET" width={32} height={32} className="rounded" />
            <span className="text-lg font-bold">KOMPLEET</span>
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-[rgba(var(--primary-rgb),0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-7 h-7 text-[rgb(var(--primary))]" />
            </div>
            <h1 className="text-2xl font-bold">Set New Password</h1>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              Enter your new password below. Make it strong and memorable.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {pageState === 'loading' ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[rgb(var(--text-secondary))]">Verifying reset link...</p>
            </div>
          ) : pageState === 'valid' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  Use a mix of letters, numbers, and symbols for better security
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Re-enter your password"
                  className="w-full"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          ) : null}

          <p className="text-center text-xs text-[rgb(var(--text-tertiary))]">
            Your password will be encrypted and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}
