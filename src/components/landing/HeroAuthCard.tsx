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

const inputClassName =
  "mt-2 h-[52px] w-full rounded-md border border-border bg-surface px-4 text-sm text-text-1 focus:border-primary focus:ring-2 focus:ring-primary/20";

function validateSignupPassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number";
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
      const message = err instanceof Error ? err.message : "";
      if (mode === "signup" && /already|exist/i.test(message)) {
        setError(
          "An account with this email already exists. Sign in, or use Forgot password.",
        );
      } else if (mode === "signin") {
        setError(
          "Invalid email or password. Existing Kompleet users: create an account on Get started with this same email to reclaim your data.",
        );
      } else {
        setError(message || "An unexpected error occurred. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        id={HERO_AUTH_ID}
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-surface p-6 shadow-2"
        aria-labelledby="hero-auth-heading"
      >
        <h2 id="hero-auth-heading" className="sr-only">
          {mode === "signup" ? "Create your Kompleet account" : "Sign in to Kompleet"}
        </h2>
        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-md border border-error/30 bg-error-bg p-3 text-sm text-error"
          >
            {error}
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
        <div className="mt-4">
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
          className="mt-6 h-[52px] w-full rounded-md bg-accent text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Get started"
              : "Sign in"}
        </button>
        <p className="mt-4 text-center text-sm text-text-2">
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
      <p className="pt-3 text-center text-xs font-medium text-text-3">
        Free during beta. No credit card required.
      </p>
    </div>
  );
}
