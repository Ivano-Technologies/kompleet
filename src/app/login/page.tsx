'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Eye, EyeOff, Moon, Shield, Lock, Sun } from 'lucide-react';

const LOGO_URL =
  'https://files.manuscdn.com/user_upload_by_module/session_file/114473754/ZeGQuujTZDuMQDVT.png';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push(redirectTo);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--text-primary))] flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[rgb(var(--primary))] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--primary))] via-[rgb(var(--primary))] to-[rgba(var(--primary-rgb),0.8)]" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-white/20 rounded-full" />
          <div className="absolute bottom-32 right-16 w-48 h-48 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 border border-white/20 rounded-full" />
        </div>
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src={LOGO_URL} alt="KOMPLEET" width={36} height={36} className="rounded" />
            <span className="text-xl font-bold text-white">KOMPLEET</span>
          </Link>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Tax compliance<br />made effortless.
          </h2>
          <p className="text-white/70 text-base max-w-sm leading-relaxed">
            Join thousands of Nigerian businesses automating their tax filings, invoicing, and financial reporting.
          </p>
          <div className="flex gap-6 text-white/60 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" /> 5,000+ businesses
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" /> FIRS compliant
            </span>
          </div>
        </div>
        <div className="relative z-10 text-white/40 text-xs">
          &copy; 2026 Ivano Technologies Ltd
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <Image src={LOGO_URL} alt="KOMPLEET" width={32} height={32} className="rounded" />
              <span className="text-lg font-bold">KOMPLEET</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="text-sm text-[rgb(var(--text-secondary))]">Enter your credentials to access your account</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <Link href="/forgot-password" className="text-xs text-[rgb(var(--primary))] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-[rgb(var(--text-secondary))]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[rgb(var(--primary))] font-medium hover:underline">
                Create one
              </Link>
            </p>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-[rgb(var(--border))]">
              <div className="flex items-center justify-center gap-4 text-xs text-[rgb(var(--text-tertiary))]">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>NDPR Compliant</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-bit SSL</span>
                </div>
              </div>
            </div>
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
        <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))]">
          <div className="text-[rgb(var(--text-primary))]">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
