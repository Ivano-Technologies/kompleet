'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Moon, Sun } from 'lucide-react';

const LOGO_URL = "/logo.png";

const BASKET_WEAVE_DARK =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%3E%3Cline%20x1='0'%20y1='5'%20x2='24'%20y2='5'%20stroke='rgba(56,70,75,0.38)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='8'%20x2='24'%20y2='8'%20stroke='rgba(56,70,75,0.22)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='17'%20x2='11'%20y2='17'%20stroke='rgba(56,70,75,0.38)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='17'%20x2='24'%20y2='17'%20stroke='rgba(56,70,75,0.38)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='20'%20x2='11'%20y2='20'%20stroke='rgba(56,70,75,0.22)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='20'%20x2='24'%20y2='20'%20stroke='rgba(56,70,75,0.22)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='5'%20y1='0'%20x2='5'%20y2='24'%20stroke='rgba(56,70,75,0.28)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='8'%20y1='0'%20x2='8'%20y2='24'%20stroke='rgba(56,70,75,0.16)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='0'%20x2='17'%20y2='3'%20stroke='rgba(56,70,75,0.28)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='10'%20x2='17'%20y2='24'%20stroke='rgba(56,70,75,0.28)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='0'%20x2='20'%20y2='3'%20stroke='rgba(56,70,75,0.16)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='10'%20x2='20'%20y2='24'%20stroke='rgba(56,70,75,0.16)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3C/svg%3E\")";
const BASKET_WEAVE_LIGHT =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%3E%3Cline%20x1='0'%20y1='5'%20x2='24'%20y2='5'%20stroke='rgba(56,70,75,0.12)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='8'%20x2='24'%20y2='8'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='17'%20x2='11'%20y2='17'%20stroke='rgba(56,70,75,0.12)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='17'%20x2='24'%20y2='17'%20stroke='rgba(56,70,75,0.12)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='20'%20x2='11'%20y2='20'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='20'%20x2='24'%20y2='20'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='5'%20y1='0'%20x2='5'%20y2='24'%20stroke='rgba(56,70,75,0.09)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='8'%20y1='0'%20x2='8'%20y2='24'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='0'%20x2='17'%20y2='3'%20stroke='rgba(56,70,75,0.09)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='10'%20x2='17'%20y2='24'%20stroke='rgba(56,70,75,0.09)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='0'%20x2='20'%20y2='3'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='10'%20x2='20'%20y2='24'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3C/svg%3E\")";

type PageState = 'loading' | 'valid' | 'expired' | 'already_logged_in' | 'success' | 'error';

function LeftPanel() {
  return (
    <div className="bg-gradient-to-br from-primary-deep to-primary p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          backgroundImage: BASKET_WEAVE_DARK,
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.85) 82%, black 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.85) 82%, black 100%)",
        }}
      />
      <div className="relative z-20">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src={LOGO_URL} alt="KOMPLEET" width={40} height={40} className="rounded-lg shadow-4" />
          <span className="font-ceoruse text-xl font-bold text-white">KOMPLEET</span>
        </Link>
      </div>
      <div className="relative z-20">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight tracking-tighter">
          Control Your Money.
          <br />
          <em className="text-accent not-italic">Grow Your Business.</em>
        </h2>
        <p className="text-base text-white/50 mt-4 max-w-sm">
          The financial operating system for Nigerian SMEs.
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordClient() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [loading, setLoading] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();
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

  const rightPanelTopBar = (
    <>
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-text-3 dark:text-dark-text-3 hover:text-text-1 dark:hover:text-dark-text-1 transition-colors"
        >
          Back to Login
        </Link>
      </div>
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <Link href="/#features" className="text-xs font-medium text-text-2 dark:text-dark-text-2 hover:text-primary">Features</Link>
        <Link href="/contact" className="text-xs font-medium text-text-2 dark:text-dark-text-2 hover:text-primary">Contact</Link>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-md border border-border dark:border-dark-border hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </>
  );

  // Success state
  if (pageState === 'success') {
    return (
      <div className="grid lg:grid-cols-2 min-h-screen">
        <LeftPanel />
        <div className="bg-surface dark:bg-dark-bg p-8 md:p-12 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Password Updated!</h1>
            <p className="text-sm text-text-3 dark:text-dark-text-3">
              Your password has been successfully reset. Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Expired link state
  if (pageState === 'expired') {
    return (
      <div className="grid lg:grid-cols-2 min-h-screen">
        <LeftPanel />
        <div className="bg-surface dark:bg-dark-bg p-8 md:p-12 flex flex-col items-center justify-center relative">
          {rightPanelTopBar}
          <div className="w-full max-w-sm text-center space-y-6 relative z-20">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Link Expired</h1>
            <p className="text-sm text-text-3 dark:text-dark-text-3">
              This password reset link has expired or is invalid. Reset links are valid for 1 hour.
            </p>
            <Link href="/forgot-password" className="block w-full bg-accent text-charcoal font-bold text-sm py-3.5 rounded-md shadow-accent hover:bg-accent-hover transition-all text-center">
              Request New Reset Link
            </Link>
            <Link href="/login" className="text-sm text-text-3 dark:text-dark-text-3 hover:text-primary transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Already logged in state
  if (pageState === 'already_logged_in') {
    return (
      <div className="grid lg:grid-cols-2 min-h-screen">
        <LeftPanel />
        <div className="bg-surface dark:bg-dark-bg p-8 md:p-12 flex flex-col items-center justify-center relative">
          {rightPanelTopBar}
          <div className="w-full max-w-sm text-center space-y-6 relative z-20">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Already Logged In</h1>
            <p className="text-sm text-text-3 dark:text-dark-text-3">
              You&apos;re already logged in. If you want to change your password, please go to Settings.
            </p>
            <Link href="/settings" className="block w-full bg-accent text-charcoal font-bold text-sm py-3.5 rounded-md shadow-accent hover:bg-accent-hover transition-all text-center">
              Go to Settings
            </Link>
            <Link href="/dashboard" className="text-sm text-text-3 dark:text-dark-text-3 hover:text-primary transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="grid lg:grid-cols-2 min-h-screen">
        <LeftPanel />
        <div className="bg-surface dark:bg-dark-bg p-8 md:p-12 flex flex-col items-center justify-center relative">
          {rightPanelTopBar}
          <div className="w-full max-w-sm text-center space-y-6 relative z-20">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Something Went Wrong</h1>
            <p className="text-sm text-text-3 dark:text-dark-text-3">
              {error || 'An unexpected error occurred. Please try again.'}
            </p>
            <Link href="/forgot-password" className="block w-full bg-accent text-charcoal font-bold text-sm py-3.5 rounded-md shadow-accent hover:bg-accent-hover transition-all text-center">
              Request New Reset Link
            </Link>
            <Link href="/login" className="text-sm text-text-3 dark:text-dark-text-3 hover:text-primary transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main form (loading or valid state)
  return (
    <div className="grid lg:grid-cols-2 min-h-screen">
      <LeftPanel />
      <div className="bg-surface dark:bg-dark-bg p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backgroundImage: BASKET_WEAVE_LIGHT,
            backgroundSize: "24px 24px",
            maskImage:
              "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 50%, rgba(0,0,0,0.3) 68%, rgba(0,0,0,0.7) 84%, black 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 50%, rgba(0,0,0,0.3) 68%, rgba(0,0,0,0.7) 84%, black 100%)",
          }}
        />
        {rightPanelTopBar}
        <div className="w-full max-w-sm relative z-20 mt-12">
          <div className="flex items-center justify-center gap-3 mb-6 lg:hidden">
            <Image src={LOGO_URL} alt="KOMPLEET" width={40} height={40} className="rounded-lg shadow-4" />
            <span className="font-ceoruse text-xl font-bold text-text-1 dark:text-dark-text-1">KOMPLEET</span>
          </div>
          <div className="text-center mb-2">
            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-7 h-7 text-accent" />
            </div>
            <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1 mb-2">Set New Password</h1>
            <p className="text-sm text-text-3 dark:text-dark-text-3 mb-6">
              Enter your new password below. Make it strong and memorable.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-md bg-error-bg dark:bg-error-darkBg border border-error/30 text-error dark:text-error-dark text-sm">
              {error}
            </div>
          )}

          {pageState === 'loading' ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-text-3 dark:text-dark-text-3">Verifying reset link...</p>
            </div>
          ) : pageState === 'valid' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="text-xs font-bold text-text-2 dark:text-dark-text-2 uppercase tracking-wider">
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
                    className="w-full pr-10 bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md p-3 text-sm text-text-1 dark:text-dark-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-3 dark:text-dark-text-3 hover:text-text-1 dark:hover:text-dark-text-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-text-4 dark:text-dark-text-4 mt-1">
                  Use a mix of letters, numbers, and symbols for better security
                </p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="text-xs font-bold text-text-2 dark:text-dark-text-2 uppercase tracking-wider">
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
                  className="w-full mt-2 bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md p-3 text-sm text-text-1 dark:text-dark-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-charcoal font-bold text-sm py-3.5 rounded-md shadow-accent hover:bg-accent-hover transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          ) : null}

          <p className="text-center text-xs text-text-4 dark:text-dark-text-4 mt-6">
            Your password will be encrypted and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}
