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
  AUTH_LINK,
  AUTH_SUBMIT,
  AUTH_SUBTITLE_FOLD,
  AUTH_TERMS,
  AUTH_TITLE,
  AUTH_TITLE_BLOCK,
  AUTH_TRUST,
} from '@/components/layout/auth-density';
import { ArrowRight, Eye, EyeOff, Shield, Lock } from 'lucide-react';
import { ErrorText } from '@/components/ui/error-ref';
import { authErrorText, mapAuthError } from '@/lib/auth/map-error';
import { didSignInComplete, verifyEmailPath } from '@/lib/auth/sign-in-result';

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
  const strength = getPasswordStrength(password);
  const { signIn } = useAuthActions();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      setLoading(false);
      return;
    }
    if (!/\d/.test(password)) {
      setError('Add at least one number to your password.');
      setLoading(false);
      return;
    }

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const result = await signIn('password', {
        email: businessEmail,
        password,
        flow: 'signUp',
        name: fullName,
        companyName: businessName,
      });
      if (didSignInComplete(result)) {
        await fetch('/api/auth/ensure-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: businessEmail, fullName }),
        }).catch(() => {});
        router.push('/dashboard');
        router.refresh();
        return;
      }
      router.push(verifyEmailPath(businessEmail));
      router.refresh();
    } catch (err) {
      setError(authErrorText(mapAuthError(err, 'signup')));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="dark-split"
      headerRightAddon={
        <span className="text-sm text-text-3 dark:text-dark-text-3">
          Already have an account?{' '}
          <Link href="/login" className={AUTH_LINK}>
            Log in
          </Link>
        </span>
      }
    >
      <div className={AUTH_TITLE_BLOCK}>
        <div className={AUTH_EYEBROW}>
          Create Account
        </div>
        <h1 className={AUTH_TITLE}>
          Sign up
        </h1>
        <p className={AUTH_SUBTITLE_FOLD}>
          Track your spending, handle invoices, and avoid surprises.
        </p>
      </div>

      {error && (
        <div id="signup-error" role="alert" className={AUTH_ERROR}>
          <ErrorText text={error} issueGeneratedRef={false} />
        </div>
      )}

      <form onSubmit={handleSubmit} className={AUTH_FORM}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="signup-first-name" className={AUTH_LABEL}>
              First Name
            </label>
            <input
              id="signup-first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="e.g. Tunde"
              autoComplete="given-name"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "signup-error" : undefined}
              className={AUTH_INPUT}
            />
          </div>
          <div>
            <label htmlFor="signup-last-name" className={AUTH_LABEL}>
              Last Name
            </label>
            <input
              id="signup-last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="e.g. Balogun"
              autoComplete="family-name"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "signup-error" : undefined}
              className={AUTH_INPUT}
            />
          </div>
        </div>

        <div>
          <label htmlFor="signup-business-name" className={AUTH_LABEL}>
            Business Name
          </label>
          <input
            id="signup-business-name"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            placeholder="e.g. Tunde Ventures Ltd"
            autoComplete="organization"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "signup-error" : undefined}
            className={AUTH_INPUT}
          />
        </div>

        <div>
          <label htmlFor="signup-business-email" className={AUTH_LABEL}>
            Business Email
          </label>
          <input
            id="signup-business-email"
            type="email"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
            required
            placeholder="name@company.ng"
            autoComplete="email"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "signup-error" : undefined}
            className={AUTH_INPUT}
          />
        </div>

        <div>
          <label htmlFor="signup-password" className={AUTH_LABEL}>
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "signup-error" : undefined}
              className={AUTH_INPUT_WITH_TOGGLE}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-text-3 hover:text-text-1 dark:text-dark-text-3 dark:hover:text-dark-text-1"
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
              <p className="text-[11px] text-text-3 dark:text-dark-text-3">
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
          {loading ? 'Creating account…' : 'Create account'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <p className={AUTH_TERMS}>
        By signing up, you agree to our{' '}
        <Link href="/terms" className={`${AUTH_LINK} underline underline-offset-2`}>Terms of Service</Link>
        {' '}and{' '}
        <Link href="/privacy" className={`${AUTH_LINK} underline underline-offset-2`}>Privacy Policy</Link>
      </p>

      <div className={AUTH_TRUST}>
        <span className="inline-flex items-center gap-1.5">
          <Shield className="h-3 w-3" />
          Encrypted at rest
        </span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3 w-3" />
          256-bit SSL
        </span>
      </div>
    </AuthLayout>
  );
}
