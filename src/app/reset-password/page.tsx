'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Eye, EyeOff, KeyRound, Moon, Sun } from 'lucide-react';

const LOGO_URL =
  'https://files.manuscdn.com/user_upload_by_module/session_file/114473754/ZeGQuujTZDuMQDVT.png';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setValidSession(true);
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const supabase = createBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => { router.push('/dashboard'); }, 2000);
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))] p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-[rgba(var(--primary-rgb),0.15)] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-[rgb(var(--primary))]" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Password Updated!</h1>
          <p className="text-[rgb(var(--text-secondary))]">
            Your password has been reset. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

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
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!validSession && !error ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[rgb(var(--text-secondary))]">Verifying reset link...</p>
            </div>
          ) : validSession ? (
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
                    minLength={8}
                    placeholder="At least 8 characters"
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
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
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
        </div>
      </div>
    </div>
  );
}
