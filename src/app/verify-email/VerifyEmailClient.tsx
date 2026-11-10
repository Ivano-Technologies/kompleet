"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { AuthLayout } from "@/components/layout/AuthLayout";
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
} from "@/components/layout/auth-density";
import { Mail } from "lucide-react";
import { AuthBackToLogin } from "@/components/auth/AuthBackToLogin";
import { FRIENDLY_MESSAGES, normalizeEmail } from "@/lib/friendly-error";
import { ErrorText } from "@/components/ui/error-ref";
import { authErrorText, mapAuthError } from "@/lib/auth/map-error";
import {
  AUTH_OTP_LENGTH,
  EMAIL_VERIFICATION_MAX_AGE_MINUTES,
  isCompleteAuthOtp,
  sanitiseAuthOtp,
} from "@/lib/auth/otp";
import { didSignInComplete } from "@/lib/auth/sign-in-result";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  const { signIn } = useAuthActions();
  const canVerify = isCompleteAuthOtp(code);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const digits = sanitiseAuthOtp(code);
    setCode(digits);
    if (!isCompleteAuthOtp(digits)) return;
    setError(null);
    setLoading(true);

    const normalizedEmail = normalizeEmail(email);
    setEmail(normalizedEmail);

    try {
      const result = await signIn("password", {
        email: normalizedEmail,
        code: digits,
        flow: "email-verification",
      });
      if (!didSignInComplete(result)) {
        setError(FRIENDLY_MESSAGES.invalidCode);
        setLoading(false);
        return;
      }
      await fetch("/api/auth/ensure-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      }).catch(() => {});
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(authErrorText(mapAuthError(err, "verify")));
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError(null);
    setResending(true);
    const normalizedEmail = normalizeEmail(email);
    setEmail(normalizedEmail);
    try {
      await signIn("password", {
        email: normalizedEmail,
        flow: "email-verification",
      });
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const mapped = mapAuthError(err, "verify-resend");
      // Missing accounts used to throw InvalidAccountId. After the server wrap
      // they may arrive as INVALID_CREDENTIALS. Treat both as a silent send so
      // we never reveal whether the email has an account.
      if (
        mapped.message === FRIENDLY_MESSAGES.invalidCredentials ||
        /InvalidAccountId/i.test(err instanceof Error ? err.message : String(err))
      ) {
        setCooldown(RESEND_COOLDOWN_SECONDS);
        return;
      }
      setError(authErrorText(mapped));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout variant="dark-split" headerLeftAddon={<AuthBackToLogin />}>
      <div className={`${AUTH_TITLE_BLOCK} text-center`}>
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-5 w-5 text-primary dark:text-teal-400" />
        </div>
        <h1 className={AUTH_TITLE}>Check your email</h1>
        <p className={AUTH_SUBTITLE}>
          We sent an 8 digit code to{" "}
          {email ? (
            <strong className="text-text-1 dark:text-dark-text-1">{email}</strong>
          ) : (
            "your inbox"
          )}
          . It expires in {EMAIL_VERIFICATION_MAX_AGE_MINUTES} minutes.
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
            onChange={(event) => setEmail(event.target.value)}
            required
            className={AUTH_INPUT}
          />
        </div>
        <div>
          <label htmlFor="code" className={AUTH_LABEL}>
            Verification code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern={`\\d{${AUTH_OTP_LENGTH}}`}
            maxLength={AUTH_OTP_LENGTH}
            value={code}
            onChange={(event) => setCode(sanitiseAuthOtp(event.target.value))}
            onPaste={(event) => {
              event.preventDefault();
              setCode(sanitiseAuthOtp(event.clipboardData.getData("text")));
            }}
            required
            placeholder="8 digit code"
            className={AUTH_INPUT}
          />
        </div>
        <button type="submit" disabled={loading || !canVerify} className={AUTH_SUBMIT}>
          {loading ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || cooldown > 0 || !email}
        className={`mt-3 w-full ${AUTH_LINK_MUTED}`}
      >
        {cooldown > 0
          ? `Resend code in ${cooldown}s`
          : resending
            ? "Sending…"
            : "Resend code"}
      </button>
    </AuthLayout>
  );
}
