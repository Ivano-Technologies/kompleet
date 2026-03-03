'use client';

import { useState, FormEvent } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Shield, Lock } from 'lucide-react';

function getPasswordStrength(pw: string) {
  const checks = { minLength: pw.length >= 8, hasNumber: /\d/.test(pw) };
  const passed = Object.values(checks).filter(Boolean).length;
  let label: string, color: string, width: string;
  if (passed === 0) { label = 'Weak'; color = 'bg-error'; width = '33%'; }
  else if (passed === 1) { label = 'Fair'; color = 'bg-warning'; width = '66%'; }
  else { label = 'Strong'; color = 'bg-success'; width = '100%'; }
  return { checks, passed, label, color, width };
}

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: businessEmail,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            business_name: businessName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout variant="dark-split">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success dark:text-success-dark" />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Account Created!</h1>
          <p className="text-text-3 dark:text-dark-text-3">
            Check your email to verify your account before signing in.
          </p>
          <Link href="/login" className="bg-primary text-white font-bold text-sm py-3 px-6 rounded-md block w-full text-center hover:bg-primary-deep transition-colors">
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      variant="dark-split"
      headerRightAddon={
        <span className="text-sm text-text-3">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Log in
          </Link>
        </span>
      }
    >
      <div className="mb-6">
        <div className="mb-2 text-xs font-bold uppercase tracking-widest text-text-4 dark:text-dark-text-4">
          Create Account
        </div>
        <h1 className="mb-2 inline-flex items-center gap-2 text-base font-bold uppercase tracking-wider text-accent dark:text-accent">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
          Built for Nigerian <span className="normal-case">SMEs</span>
        </h1>
        <p className="text-sm text-text-3 dark:text-dark-text-3">
          Track your spending, handle invoices, and avoid surprises.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-error/30 bg-error-bg p-3 text-sm text-error dark:bg-error-darkBg dark:text-error-dark">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="e.g. Tunde"
              className="mt-2 h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm text-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:text-dark-text-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="e.g. Balogun"
              className="mt-2 h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm text-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:text-dark-text-1"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            placeholder="e.g. Tunde Ventures Ltd"
            className="mt-2 h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm text-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:text-dark-text-1"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
            Business Email
          </label>
          <input
            type="email"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            required
            placeholder="name@company.ng"
            className="mt-2 h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm text-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:text-dark-text-1"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
            Password
          </label>
          <div className="relative mt-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 pr-11 text-sm text-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:text-dark-text-1"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-4 hover:text-text-1 dark:text-dark-text-4 dark:hover:text-dark-text-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="h-1 overflow-hidden rounded-full bg-surface-2 dark:bg-dark-surface-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-xs text-text-4 dark:text-dark-text-4">
                Password strength: <span className="font-semibold">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-bold text-charcoal shadow-accent transition-all hover:-translate-y-0.5 hover:bg-accent-hover disabled:opacity-50 disabled:transform-none"
        >
          {loading ? 'Creating account…' : 'Create Free Account'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-text-4 dark:text-dark-text-4">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
      </p>

      <div className="mt-6 border-t border-border pt-5 dark:border-dark-border">
        <div className="flex items-center justify-center gap-5 text-xs text-text-4 dark:text-dark-text-4">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span>NDPR Compliant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>256-bit SSL</span>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
