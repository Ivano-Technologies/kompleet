'use client';

import { useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Moon, Sun } from 'lucide-react';

const LOGO_URL =
  '/assets/logo-primary.png';

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        setError('No email address found. Please sign up again.');
        setResending(false);
        return;
      }

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setResent(true);
      }
    } catch {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] flex flex-col">
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

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image src={LOGO_URL} alt="KOMPLEET" width={32} height={32} className="rounded" />
            <span className="text-lg font-bold">KOMPLEET</span>
          </div>

          <div className="space-y-4">
            <div className="w-14 h-14 bg-[rgba(var(--primary-rgb),0.1)] rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7 text-[rgb(var(--primary))]" />
            </div>
            <h1 className="text-2xl font-bold">Verify Your Email</h1>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              We sent a verification link to your email address. Please check your inbox and click the link to activate your account.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {resent && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
              <p className="text-green-600 dark:text-green-400 text-sm">Verification email resent successfully.</p>
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={resending || resent}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? 'Resending...' : resent ? 'Email Sent' : 'Resend Verification Email'}
          </button>

          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            Wrong email? <Link href="/signup" className="text-[rgb(var(--primary))] hover:underline">Sign up again</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
