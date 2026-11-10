'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthActions } from '@convex-dev/auth/react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import {
  AUTH_ERROR,
  AUTH_FORM,
  AUTH_INPUT,
  AUTH_INPUT_WITH_TOGGLE,
  AUTH_LABEL,
  AUTH_SUBMIT,
  AUTH_SUBTITLE,
  AUTH_TITLE,
  AUTH_TITLE_BLOCK,
} from '@/components/layout/auth-density';
import { CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { AuthBackToLogin } from '@/components/auth/AuthBackToLogin';
import { FRIENDLY_MESSAGES, normalizeEmail } from '@/lib/friendly-error';
import { ErrorText } from '@/components/ui/error-ref';
import { authErrorText, mapAuthError } from '@/lib/auth/map-error';
import {
  AUTH_OTP_LENGTH,
  isCompleteAuthOtp,
  sanitiseAuthOtp,
} from '@/lib/auth/otp';

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuthActions();
  const canSubmit = isCompleteAuthOtp(code);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const digits = sanitiseAuthOtp(code);
    setCode(digits);
    if (!isCompleteAuthOtp(digits)) return;
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Make sure both passwords match.');
      setLoading(false);
      return;
    }

    if (password.length < 8 || !/\d/.test(password)) {
      setError('Use at least 8 characters, including a number.');
      setLoading(false);
      return;
    }

    try {
      await signIn('password', {
        email: normalizeEmail(email),
        code: digits,
        newPassword: password,
        flow: 'reset-verification',
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err) {
      const mapped = mapAuthError(err, 'reset');
      setError(
        authErrorText(
          mapped.message === FRIENDLY_MESSAGES.invalidCredentials
            ? { ...mapped, message: FRIENDLY_MESSAGES.invalidCode, known: true }
            : mapped,
        ),
      );
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout variant="dark-split" headerLeftAddon={<AuthBackToLogin />}>
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-6 w-6 text-accent" />
          </div>
          <h1 className={AUTH_TITLE}>Password Updated!</h1>
          <p className={AUTH_SUBTITLE}>
            Your password has been reset. Redirecting to dashboard...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="dark-split" headerLeftAddon={<AuthBackToLogin />}>
      <div className={`${AUTH_TITLE_BLOCK} text-center`}>
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
          <KeyRound className="h-5 w-5 text-accent" />
        </div>
        <h1 className={AUTH_TITLE}>Set New Password</h1>
        <p className={AUTH_SUBTITLE}>
          Enter the 8-digit code from your email and choose a new password.
        </p>
      </div>

      {error && (
        <div className={AUTH_ERROR}>
          <ErrorText text={error} issueGeneratedRef={false} />
        </div>
      )}

      <form onSubmit={handleSubmit} className={AUTH_FORM}>
        <div>
          <label htmlFor="email" className={AUTH_LABEL}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={AUTH_INPUT}
          />
        </div>
        <div>
          <label htmlFor="code" className={AUTH_LABEL}>
            Reset code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern={`\\d{${AUTH_OTP_LENGTH}}`}
            maxLength={AUTH_OTP_LENGTH}
            value={code}
            onChange={(e) => setCode(sanitiseAuthOtp(e.target.value))}
            onPaste={(e) => {
              e.preventDefault();
              setCode(sanitiseAuthOtp(e.clipboardData.getData('text')));
            }}
            required
            placeholder="8-digit code"
            className={AUTH_INPUT}
          />
        </div>
        <div>
          <label htmlFor="password" className={AUTH_LABEL}>
            New Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className={AUTH_INPUT_WITH_TOGGLE}
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
        </div>
        <div>
          <label htmlFor="confirmPassword" className={AUTH_LABEL}>
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Re-enter your password"
            className={AUTH_INPUT}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className={AUTH_SUBMIT}
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  );
}
