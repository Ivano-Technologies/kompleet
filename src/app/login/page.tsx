"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { AuthLayout } from "@/components/layout/AuthLayout";
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
  AUTH_TITLE,
  AUTH_TITLE_BLOCK,
} from "@/components/layout/auth-density";
import { Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const { signIn } = useAuthActions();

  useEffect(() => {
    const err = searchParams.get("error");
    const msg = searchParams.get("message");
    if (err === "auth_failed") setError(msg || "Authentication failed.");
    if (err === "expired_link") setError(msg || "This link has expired.");
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      await fetch("/api/auth/ensure-profile", { method: "POST" }).catch(() => {});
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(
        "Invalid email or password. Existing Kompleet users: create an account on Sign up with this same email to reclaim your data.",
      );
      setLoading(false);
    }
  };

  return (
    <AuthLayout variant="dark-split" imagePriority>
      <div className={AUTH_TITLE_BLOCK}>
        <div className={AUTH_EYEBROW}>Welcome Back</div>
        <h2 className={AUTH_TITLE}>Sign in</h2>
        <p className={AUTH_SUBTITLE_FOLD}>
          Access your business financial dashboard.
        </p>
      </div>
      {error && <div className={AUTH_ERROR}>{error}</div>}
      <form onSubmit={handleSubmit} className={AUTH_FORM}>
        <div>
          <label className={AUTH_LABEL}>Business Email</label>
          <input
            type="email"
            placeholder="you@company.ng"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={AUTH_INPUT}
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className={AUTH_LABEL}>Password</label>
            <Link href="/forgot-password" className={`text-xs ${AUTH_LINK}`}>
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={AUTH_INPUT_WITH_TOGGLE}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-3 hover:text-text-1 dark:text-dark-text-3 dark:hover:text-dark-text-1"
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
        <button type="submit" disabled={loading} className={AUTH_SUBMIT}>
          {loading ? "Signing in…" : "Sign In →"}
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-text-3 dark:text-dark-text-3">
        New to Kompleet?{" "}
        <Link href="/signup" className={AUTH_LINK}>
          Get started
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-dark-bg">
          <div className="text-text-1 dark:text-dark-text-1">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
