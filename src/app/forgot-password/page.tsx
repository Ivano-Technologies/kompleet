'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, KeyRound, Mail, Moon, Sun } from 'lucide-react';

const LOGO_URL =
  '/assets/logo-primary.png';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-[rgba(var(--primary-rgb),0.15)] rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-[rgb(var(--primary))]" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Check Your Email</h1>
          <p className="text-[rgb(var(--text-secondary))]">
            We&apos;ve sent a password reset link to <strong className="text-[rgb(var(--text-primary))]">{email}</strong>
          </p>
          <Link href="/login" className="btn-primary block w-full text-center py-3">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-6">
        <Link href="/login" className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
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
            <h1 className="text-2xl font-bold">Reset your password</h1>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                className="w-full"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-xs text-[rgb(var(--text-tertiary))]">
            Secure link expires in 60 minutes for your protection.
          </p>
        </div>
      </div>
    </div>
  );
}
