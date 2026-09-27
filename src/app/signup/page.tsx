'use client';

import { useState, FormEvent } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import {
  AUTH_ERROR,
  AUTH_EYEBROW,
  AUTH_FORM,
  AUTH_INPUT,
  AUTH_INPUT_WITH_TOGGLE,
  AUTH_LABEL,
  AUTH_SUBMIT,
  AUTH_SUBTITLE,
  AUTH_TITLE,
} from '@/components/layout/auth-density';
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
  const { signIn } = useAuthActions();
  const router = useRouter();

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
      const fullName = `${firstName} ${lastName}`.trim();
      await signIn('password', {
        email: businessEmail,
        password,
        flow: 'signUp',
        name: fullName,
        companyName: businessName,
      });
      await fetch('/api/auth/ensure-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: businessEmail, fullName }),
      }).catch(() => {});
      setSuccess(true);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (/already|exist/i.test(message)) {
        setError('An account with this email already exists. Sign in, or use Forgot password.');
      } else {
        setError(message || 'An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout variant="dark-split">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-6 w-6 text-success dark:text-success-dark" />
          </div>
          <h1 className={AUTH_TITLE}>Account Created!</h1>
          <p className={AUTH_SUBTITLE}>
            Your account is ready. Existing Kompleet data for this email stays attached.
          </p>
          <Link href="/dashboard" className="bg-primary text-white font-bold text-sm py-2.5 px-6 rounded-md block w-full text-center hover:bg-primary-deep transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="dark-split">
      <div className="mb-3">
        <div className={AUTH_EYEBROW}>
          Create Account
        </div>
        <h1 className={AUTH_TITLE}>
          Sign up
        </h1>
        <p className={AUTH_SUBTITLE}>
          Track your spending, handle invoices, and avoid surprises.
        </p>
      </div>

      {error && (
        <div className={AUTH_ERROR}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={AUTH_FORM}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={AUTH_LABEL}>
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="e.g. Tunde"
              className={AUTH_INPUT}
            />
          </div>
          <div>
            <label className={AUTH_LABEL}>
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="e.g. Balogun"
              className={AUTH_INPUT}
            />
          </div>
        </div>

        <div>
          <label className={AUTH_LABEL}>
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            placeholder="e.g. Tunde Ventures Ltd"
            className={AUTH_INPUT}
          />
        </div>

        <div>
          <label className={AUTH_LABEL}>
            Business Email
          </label>
          <input
            type="email"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            required
            placeholder="name@company.ng"
            className={AUTH_INPUT}
          />
        </div>

        <div>
          <label className={AUTH_LABEL}>
            Password
          </label>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className={AUTH_INPUT_WITH_TOGGLE}
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
            <div className="mt-1.5 space-y-1">
              <div className="h-1 overflow-hidden rounded-full bg-surface-2 dark:bg-dark-surface-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-[11px] text-text-4 dark:text-dark-text-4">
                Password strength: <span className="font-semibold">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={AUTH_SUBMIT}
        >
          {loading ? 'Creating account…' : 'Create Free Account'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-text-3 dark:text-dark-text-3">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Log in
        </Link>
      </p>

      <p className="mt-2 text-center text-[11px] text-text-4 dark:text-dark-text-4">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
      </p>

      <div className="mt-3 border-t border-border pt-3 dark:border-dark-border">
        <div className="flex items-center justify-center gap-4 text-[11px] text-text-4 dark:text-dark-text-4">
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
