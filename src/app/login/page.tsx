"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useTheme } from "@/contexts/ThemeContext";
import { Eye, EyeOff, Moon, Sun, ShieldCheck, Zap, TrendingUp } from "lucide-react";

const LIFESTYLE_PHOTO = "/assets/auth-lifestyle.jpg";

const TRUST_BULLETS = [
  { icon: ShieldCheck, label: "Bank-grade encryption & NDPR compliant" },
  { icon: Zap,         label: "Real-time expense tracking, zero lag" },
  { icon: TrendingUp,  label: "Built for Nigerian SMEs — free during Beta" },
];

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme, toggleTheme } = useTheme();
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
    <div className="min-h-screen lg:grid lg:grid-cols-2">

      {/* ── LEFT: Form panel ── */}
      <div className="flex flex-col min-h-screen bg-white dark:bg-dark-bg px-8 py-10 md:px-14">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/">
            <Image
              src="/assets/logo-primary.png"
              alt="Kompleet"
              width={130}
              height={36}
              className="h-9 w-auto dark:hidden"
              priority
            />
            <Image
              src="/assets/logo-inverted.png"
              alt="Kompleet"
              width={130}
              height={36}
              className="h-9 w-auto hidden dark:block"
              priority
            />
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-full border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-surface-2 transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "light"
              ? <Moon className="w-4 h-4 text-gray-500" />
              : <Sun className="w-4 h-4 text-yellow-400" />}
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
          <p className="text-xs font-bold text-primary dark:text-accent uppercase tracking-widest mb-2">
            Welcome back
          </p>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-dark-text-1 mb-1">
            Sign in to Kompleet
          </h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-3 mb-8">
            Access your business financial dashboard.
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-dark-text-2 mb-1.5">
                Business Email
              </label>
              <input
                type="email"
                placeholder="you@company.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full px-5 py-3 text-sm text-gray-900 dark:text-dark-text-1 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-dark-text-2">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full px-5 py-3 pr-12 text-sm text-gray-900 dark:text-dark-text-1 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3.5 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-dark-text-3 mt-6">
            New to Kompleet?{" "}
            <Link href="/signup" className="font-bold text-primary hover:underline">
              Create a free account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 dark:text-dark-text-4 mt-10">
          © {new Date().getFullYear()} Ivano Technologies Ltd ·{" "}
          <Link href="/kompleet-privacy.html" className="hover:underline">Privacy</Link>
          {" · "}
          <Link href="/kompleet-terms.html" className="hover:underline">Terms</Link>
        </p>
      </div>

      {/* ── RIGHT: Lifestyle photo panel (desktop only) ── */}
      <div className="hidden lg:block relative overflow-hidden">
        <Image
          src={LIFESTYLE_PHOTO}
          alt="Business professional using Kompleet"
          fill
          className="object-cover object-center"
          priority
          sizes="50vw"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
        {/* Accent top strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />

        {/* Brand content */}
        <div className="absolute inset-0 flex flex-col justify-end p-12 z-10">
          <blockquote className="mb-8">
            <p className="text-white text-2xl font-display font-bold leading-snug max-w-sm">
              &ldquo;Your finances,<br />finally in control.&rdquo;
            </p>
            <p className="text-white/60 text-sm mt-3 font-medium">
              — Built for Nigerian entrepreneurs
            </p>
          </blockquote>

          <ul className="space-y-3">
            {TRUST_BULLETS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-accent" />
                </span>
                <span className="text-white/80 text-sm">{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 pt-6 border-t border-white/10">
            <Image
              src="/assets/logo-inverted.png"
              alt="Kompleet"
              width={100}
              height={28}
              className="h-7 w-auto opacity-60"
            />
          </div>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-dark-bg">
          <div className="text-gray-400">Loading…</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
