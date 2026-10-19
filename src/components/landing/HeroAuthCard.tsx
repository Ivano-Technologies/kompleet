"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  HERO_AUTH_EVENT,
  HERO_AUTH_ID,
  type HeroAuthMode,
} from "@/components/landing/hero-auth";
import { FRIENDLY_MESSAGES, toFriendlyError, withRef } from "@/lib/friendly-error";
import { ErrorText } from "@/components/ui/error-ref";

const inputClassName =
  "mt-1.5 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-1 focus:border-primary focus:ring-2 focus:ring-primary/20";

function validateSignupPassword(password: string): string | null {
  if (password.length < 8) {
    return "Use a password with at least 8 characters.";
  }
  if (!/\d/.test(password)) {
    return "Add at least one number to your password.";
  }
  return null;
}

export default function HeroAuthCard() {
  const [mode, setMode] = useState<HeroAuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const { signIn } = useAuthActions();
  const router = useRouter();

  const focusSignIn = useCallback(() => {
    setMode("signin");
    setError(null);
    window.requestAnimationFrame(() => {
      emailRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    const onFocusRequest = (event: Event) => {
      const detail = (event as CustomEvent<HeroAuthMode>).detail;
      if (detail === "signup") {
        setMode("signup");
        setError(null);
      } else {
        focusSignIn();
      }
    };

    window.addEventListener(HERO_AUTH_EVENT, onFocusRequest);

    if (window.location.hash === `#${HERO_AUTH_ID}`) {
      focusSignIn();
    }

    return () => {
      window.removeEventListener(HERO_AUTH_EVENT, onFocusRequest);
    };
  }, [focusSignIn]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (mode === "signup") {
      const passwordError = validateSignupPassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    setLoading(true);
    try {
      await signIn("password", {
        email,
        password,
        flow: mode === "signup" ? "signUp" : "signIn",
      });
      await fetch("/api/auth/ensure-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const { message, ref } = toFriendlyError(err, FRIENDLY_MESSAGES.fallback, {
        context: `hero-auth:${mode}`,
      });
      const signInMismatch =
        mode === "signin" &&
        message !== FRIENDLY_MESSAGES.network &&
        message !== FRIENDLY_MESSAGES.rateLimited;
      setError(withRef(signInMismatch ? FRIENDLY_MESSAGES.invalidCredentials : message, ref));
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        id={HERO_AUTH_ID}
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-surface p-4 shadow-2"
        aria-labelledby="hero-auth-heading"
      >
        <h2 id="hero-auth-heading" className="sr-only">
          {mode === "signup" ? "Create your Kompleet account" : "Sign in to Kompleet"}
        </h2>
        {error ? (
          <div
            role="alert"
            className="mb-3 rounded-md border border-error/30 bg-error-bg p-2.5 text-sm text-error"
          >
            <ErrorText text={error} />
          </div>
        ) : null}
        <div>
          <label
            htmlFor="hero-auth-email"
            className="text-xs font-bold uppercase tracking-wider text-text-2"
          >
            Email
          </label>
          <input
            ref={emailRef}
            id="hero-auth-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.ng"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className={inputClassName}
          />
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="hero-auth-password"
              className="text-xs font-bold uppercase tracking-wider text-text-2"
            >
              Password
            </label>
            {mode === "signin" ? (
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-text-2 hover:text-text-1"
              >
                Forgot password?
              </Link>
            ) : null}
          </div>
          <div className="relative">
            <input
              id="hero-auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={
                mode === "signup" ? "Minimum 8 characters" : "Enter your password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={mode === "signup" ? 8 : undefined}
              className={`${inputClassName} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-3 hover:text-text-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 h-11 w-full rounded-md bg-accent text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Get started"
              : "Sign in"}
        </button>
        {mode === "signin" ? (
          <p data-testid="reclaim-note" className="mt-2 text-center text-xs tracking-normal [word-spacing:0.12em] text-text-3">
            {"Existing Kompleet users: choose Get started and use this same email to reclaim your data."}
          </p>
        ) : null}
        <p className="mt-3 text-center text-sm text-text-2">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={focusSignIn}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New to Kompleet?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Get started
              </button>
            </>
          )}
        </p>
      </form>
      <p className="pt-2 text-center text-xs font-medium text-text-3">
        Free during beta. No credit card required.
      </p>
    </div>
  );
}
