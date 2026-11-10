'use client';

import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import Link from 'next/link';
import { AuthLayout } from '@/components/layout/AuthLayout';
import {
  AUTH_ERROR,
  AUTH_FORM,
  AUTH_INPUT,
  AUTH_LABEL,
  AUTH_LINK_MUTED,
  AUTH_SUBMIT,
  AUTH_SUBTITLE,
  AUTH_TITLE,
  AUTH_TITLE_BLOCK,
} from '@/components/layout/auth-density';
import { KeyRound, Mail } from 'lucide-react';
import { AuthBackToLogin } from '@/components/auth/AuthBackToLogin';
import {
  FRIENDLY_MESSAGES,
  isNetworkError,
  normalizeEmail,
} from '@/lib/friendly-error';
import { ErrorText } from '@/components/ui/error-ref';
import { authErrorText, mapAuthError } from '@/lib/auth/map-error';
import { PASSWORD_RESET_MAX_AGE_MINUTES } from '@/lib/auth/otp';

const NETWORK_ERROR_MESSAGE =
  "We couldn't send the code. Check your connection and try again.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signIn } = useAuthActions();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = normalizeEmail(email);
    setEmail(normalizedEmail);

    try {
      await signIn('password', { email: normalizedEmail, flow: 'reset' });
      setSuccess(true);
    } catch (err: unknown) {
      const mapped = mapAuthError(err, 'forgot');
      if (isNetworkError(err) || mapped.message === FRIENDLY_MESSAGES.network) {
        setError(authErrorText({ ...mapped, message: NETWORK_ERROR_MESSAGE, known: true }));
      } else if (
        mapped.message === FRIENDLY_MESSAGES.rateLimited ||
        mapped.message.startsWith('Too many attempts')
      ) {
        setError(authErrorText({ ...mapped, known: true }));
      } else if (!mapped.known) {
        // Redacted plain Server Error is a real fault (Resend, keys), not a
        // missing account. Show the generic copy and hide the Ref.
        setError(authErrorText(mapped));
      } else {
        // Unknown accounts (InvalidAccountId / INVALID_CREDENTIALS) get the
        // same success screen so we never reveal whether an account exists.
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout variant="dark-split">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary dark:text-teal-400" />
          </div>
          <h1 className={AUTH_TITLE}>Check Your Email</h1>
          <p className={AUTH_SUBTITLE}>
            If an account exists for <strong className="text-text-1 dark:text-dark-text-1">{email}</strong>, we sent an 8-digit reset code.
          </p>
          <Link
            href={`/reset-password?email=${encodeURIComponent(email)}`}
            className={AUTH_SUBMIT}
          >
            Enter reset code
          </Link>
          <Link href="/login" className={AUTH_LINK_MUTED}>
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      variant="dark-split"
      headerLeftAddon={<AuthBackToLogin />}
    >
      <div className={`${AUTH_TITLE_BLOCK} text-center`}>
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary dark:text-teal-400" />
        </div>
        <h1 className={AUTH_TITLE}>Reset your password</h1>
        <p className={AUTH_SUBTITLE}>
          Enter your email to get an 8-digit code to reset your password.
        </p>
      </div>

      {error && (
        <div className={AUTH_ERROR}>
          <ErrorText text={error} issueGeneratedRef={false} />
        </div>
      )}

      <form onSubmit={handleResetPassword} className={AUTH_FORM}>
        <div>
          <label htmlFor="email" className={AUTH_LABEL}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@company.com"
            className={AUTH_INPUT}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={AUTH_SUBMIT}
        >
          {loading ? 'Sending...' : 'Send reset code'}
        </button>
      </form>

      <p className={`mt-3 text-center ${AUTH_SUBTITLE}`}>
        The code expires in {PASSWORD_RESET_MAX_AGE_MINUTES} minutes.
      </p>
    </AuthLayout>
  );
}
