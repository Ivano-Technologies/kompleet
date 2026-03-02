'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun, ShieldCheck, Zap, TrendingUp, CheckCircle2, ArrowLeft } from 'lucide-react';

const LIFESTYLE_PHOTO = "/assets/auth-lifestyle.jpg";

const TRUST_BULLETS = [
  { icon: ShieldCheck, label: "Bank-grade encryption & NDPR compliant" },
  { icon: Zap,         label: "Real-time expense tracking, zero lag" },
  { icon: TrendingUp,  label: "Built for Nigerian SMEs — free during Beta" },
];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send reset email.'); setLoading(false); return; }
      setSent(true);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* LEFT: Form panel */}
      <div className="flex flex-col min-h-screen bg-white dark:bg-dark-bg px-8 py-10 md:px-14">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/">
            <Image src="/assets/logo-primary.png" alt="Kompleet" width={130} height={36} className="h-9 w-auto dark:hidden" priority />
            <Image src="/assets/logo-inverted.png" alt="Kompleet" width={130} height={36} className="h-9 w-auto hidden dark:block" priority />
          </Link>
          <button type="button" onClick={toggleTheme} className="p-2 rounded-full border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-surface-2 transition-colors" aria-label="Toggle theme">
            {resolvedTheme === 'light' ? <Moon className="w-4 h-4 text-gray-500" /> : <Sun className="w-4 h-4 text-yellow-400" />}
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-dark-text-1 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 dark:text-dark-text-3 mb-6">
                We sent a password reset link to <strong>{email}</strong>. It expires in 1 hour.
              </p>
              <Link href="/login" className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3.5 rounded-full transition-all flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-primary dark:text-accent uppercase tracking-widest mb-2">Account recovery</p>
              <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-dark-text-1 mb-1">Reset your password</h1>
              <p className="text-sm text-gray-500 dark:text-dark-text-3 mb-8">
                Enter your business email and we will send you a secure reset link.
              </p>

              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-dark-text-2 mb-1.5">Business Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.ng"
                    className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full px-5 py-3 text-sm text-gray-900 dark:text-dark-text-1 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3.5 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none">
                    {loading ? 'Sending…' : 'Send Reset Link →'}
                  </button>
                </div>
              </form>

              <p className="text-center text-sm text-gray-500 dark:text-dark-text-3 mt-6">
                Remembered it?{' '}
                <Link href="/login" className="font-bold text-primary hover:underline">Back to Sign In</Link>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-dark-text-4 mt-10">
          © {new Date().getFullYear()} Ivano Technologies Ltd ·{' '}
          <Link href="/kompleet-privacy.html" className="hover:underline">Privacy</Link>{' · '}
          <Link href="/kompleet-terms.html" className="hover:underline">Terms</Link>
        </p>
      </div>

      {/* RIGHT: Lifestyle photo panel */}
      <div className="hidden lg:block relative overflow-hidden">
        <Image src={LIFESTYLE_PHOTO} alt="Business professional using Kompleet" fill className="object-cover object-center" priority sizes="50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
        <div className="absolute inset-0 flex flex-col justify-end p-12 z-10">
          <blockquote className="mb-8">
            <p className="text-white text-2xl font-display font-bold leading-snug max-w-sm">&ldquo;Your finances,<br />finally in control.&rdquo;</p>
            <p className="text-white/60 text-sm mt-3 font-medium">— Built for Nigerian entrepreneurs</p>
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
            <Image src="/assets/logo-inverted.png" alt="Kompleet" width={100} height={28} className="h-7 w-auto opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
}
