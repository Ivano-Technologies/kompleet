"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/layout/AuthLayout";
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      if (data.session) {
        const supabase = createSupabaseClient();
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        router.push(redirectTo);
        router.refresh();
      } else {
        setLoading(false);
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout imagePriority>
      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-text-4 dark:text-dark-text-4">
        Welcome Back
      </div>
      <h2 className="mb-2 font-display text-3xl font-bold text-text-1 dark:text-dark-text-1">
        Sign in
      </h2>
      <p className="mb-5 text-sm text-text-3 dark:text-dark-text-3">
        Access your business financial dashboard.
      </p>
      {error && (
        <div className="mb-6 rounded-md border border-error/30 bg-error-bg p-3 text-sm text-error dark:bg-error-darkBg dark:text-error-dark">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
            Business Email
          </label>
          <input
            type="email"
            placeholder="you@company.ng"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2 w-full rounded-md border-2 border-border bg-surface p-3 text-sm text-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-1"
          />
        </div>
        <div className="mt-2 mb-2 flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-bold text-primary hover:underline"
          >
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
            className="w-full rounded-md border-2 border-border bg-surface-2 p-3 pr-10 text-sm text-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-dark-border dark:bg-dark-surface-2 dark:text-dark-text-1"
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
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full transform rounded-md bg-accent py-3.5 text-sm font-bold text-charcoal shadow-accent transition-all hover:-translate-y-0.5 hover:bg-accent-hover disabled:opacity-50 disabled:transform-none"
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm text-text-3 dark:text-dark-text-3">
        New to Kompleet?{" "}
        <Link href="/signup" className="font-bold uppercase tracking-wider text-accent hover:text-accent-hover dark:text-accent">
          Get Started for Free
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
