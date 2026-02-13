'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
        // Redirect to intended destination or dashboard
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-background dark">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">K</span>
              </div>
              <span className="text-2xl font-bold text-dark-text-primary">KOMPLEET</span>
            </div>
          </Link>
        </div>

        {/* Card - Solid Design */}
        <div className="solid-card bg-dark-surface border-dark-border p-8">
          <h1 className="text-2xl font-bold text-dark-text-primary mb-2">Welcome back</h1>
          <p className="text-dark-text-secondary mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 bg-error-dark/10 border border-error-dark/20 rounded-lg">
              <p className="text-error-dark text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-text-secondary mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-dark-surface-hover border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-dark-text-secondary">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary-500 hover:text-primary-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-dark-surface-hover border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-dark-text-secondary">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
                Create account
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/sign-in"
              className="text-xs text-dark-text-tertiary hover:text-dark-text-secondary transition-colors"
            >
              Use magic link instead →
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 pt-6 border-t border-dark-border">
            <div className="flex items-center justify-center gap-4 text-xs text-dark-text-tertiary">
              <div className="flex items-center gap-1">
                <span className="material-icons text-sm">security</span>
                <span>NDPR Compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-icons text-sm">lock</span>
                <span>256-bit SSL</span>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-dark-background dark"><div className="text-dark-text-primary">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
