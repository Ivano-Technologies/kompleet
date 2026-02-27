"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";

const BASKET_WEAVE_DARK =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%3E%3Cline%20x1='0'%20y1='5'%20x2='24'%20y2='5'%20stroke='rgba(56,70,75,0.38)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='8'%20x2='24'%20y2='8'%20stroke='rgba(56,70,75,0.22)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='17'%20x2='11'%20y2='17'%20stroke='rgba(56,70,75,0.38)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='17'%20x2='24'%20y2='17'%20stroke='rgba(56,70,75,0.38)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='20'%20x2='11'%20y2='20'%20stroke='rgba(56,70,75,0.22)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='20'%20x2='24'%20y2='20'%20stroke='rgba(56,70,75,0.22)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='5'%20y1='0'%20x2='5'%20y2='24'%20stroke='rgba(56,70,75,0.28)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='8'%20y1='0'%20x2='8'%20y2='24'%20stroke='rgba(56,70,75,0.16)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='0'%20x2='17'%20y2='3'%20stroke='rgba(56,70,75,0.28)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='10'%20x2='17'%20y2='24'%20stroke='rgba(56,70,75,0.28)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='0'%20x2='20'%20y2='3'%20stroke='rgba(56,70,75,0.16)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='10'%20x2='20'%20y2='24'%20stroke='rgba(56,70,75,0.16)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3C/svg%3E\")";
const BASKET_WEAVE_LIGHT =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%3E%3Cline%20x1='0'%20y1='5'%20x2='24'%20y2='5'%20stroke='rgba(56,70,75,0.12)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='8'%20x2='24'%20y2='8'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='17'%20x2='11'%20y2='17'%20stroke='rgba(56,70,75,0.12)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='17'%20x2='24'%20y2='17'%20stroke='rgba(56,70,75,0.12)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='20'%20x2='11'%20y2='20'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='20'%20x2='24'%20y2='20'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='5'%20y1='0'%20x2='5'%20y2='24'%20stroke='rgba(56,70,75,0.09)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='8'%20y1='0'%20x2='8'%20y2='24'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='0'%20x2='17'%20y2='3'%20stroke='rgba(56,70,75,0.09)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='10'%20x2='17'%20y2='24'%20stroke='rgba(56,70,75,0.09)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='0'%20x2='20'%20y2='3'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='10'%20x2='20'%20y2='24'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3C/svg%3E\")";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="grid lg:grid-cols-2 min-h-screen">
      {/* Left Panel */}
      <div className="bg-gradient-to-br from-primary-deep to-primary p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        <div
          className="absolute inset-0 z-10 opacity-100"
          style={{
            backgroundImage: BASKET_WEAVE_DARK,
            backgroundSize: "24px 24px",
            maskImage:
              "linear-gradient(to right, black 0%, rgba(0,0,0,0.9) 18%, rgba(0,0,0,0.3) 52%, rgba(0,0,0,0) 76%)",
            WebkitMaskImage:
              "linear-gradient(to right, black 0%, rgba(0,0,0,0.9) 18%, rgba(0,0,0,0.3) 52%, rgba(0,0,0,0) 76%)",
          }}
        />
        <div className="relative z-20">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Kompleet Logo"
              width={40}
              height={40}
              className="rounded-lg shadow-4"
            />
            <span className="font-display text-xl font-bold text-white tracking-wider">
              KOMPLEET
            </span>
          </div>
        </div>
        <div className="relative z-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight tracking-tighter">
            Control Your Money.
            <br />
            <em className="text-accent not-italic">Grow</em> Your Business.
          </h2>
          <p className="text-base text-white/50 mt-4 max-w-sm">
            The financial operating system for Nigerian SMEs.
          </p>
        </div>
        <div className="relative z-20 grid grid-cols-2 gap-3">
          <div className="bg-white/10 border border-white/15 rounded-md p-4">
            <div className="font-display text-2xl font-bold text-accent">
              ₦2.5B+
            </div>
            <div className="text-xs text-white/40 mt-1">Processed</div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-md p-4">
            <div className="font-display text-2xl font-bold text-accent">
              5,000+
            </div>
            <div className="text-xs text-white/40 mt-1">Businesses</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="bg-surface dark:bg-dark-bg p-8 md:p-12 flex items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 z-10 opacity-100"
          style={{
            backgroundImage: BASKET_WEAVE_LIGHT,
            backgroundSize: "24px 24px",
            maskImage:
              "linear-gradient(to left, black 0%, rgba(0,0,0,0.8) 14%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0) 62%)",
            WebkitMaskImage:
              "linear-gradient(to left, black 0%, rgba(0,0,0,0.8) 14%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0) 62%)",
          }}
        />
        <div className="w-full max-w-sm relative z-20">
          <div className="text-xs font-bold text-text-4 dark:text-dark-text-4 uppercase tracking-widest mb-2">
            Welcome Back
          </div>
          <h2 className="font-display text-3xl font-bold text-text-1 dark:text-dark-text-1 mb-2">
            Sign in to KOMPLEET
          </h2>
          <p className="text-sm text-text-3 dark:text-dark-text-3 mb-8">
            Access your business financial dashboard.
          </p>
          {error && (
            <div className="mb-6 p-3 rounded-md bg-error-bg dark:bg-error-darkBg border border-error/30 text-error dark:text-error-dark text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-text-2 dark:text-dark-text-2 uppercase tracking-wider">
                Business Email
              </label>
              <input
                type="email"
                placeholder="you@company.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-2 bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md p-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-2 dark:text-dark-text-2 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full mt-2 bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md p-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold text-sm py-3.5 rounded-md shadow-primary hover:bg-primary-deep transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
          <p className="text-center text-sm text-text-3 dark:text-dark-text-3 mt-6">
            New to Kompleet?{" "}
            <Link href="/signup" className="font-bold text-primary">
              Get Started for Free
            </Link>
          </p>
        </div>
      </div>
    </div>
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
