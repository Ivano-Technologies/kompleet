'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, KeyRound, Mail, Moon, Sun } from 'lucide-react';

const LOGO_URL = "/logo.png";

const BASKET_WEAVE_DARK =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%3E%3Cline%20x1='0'%20y1='5'%20x2='24'%20y2='5'%20stroke='rgba(56,70,75,0.38)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='8'%20x2='24'%20y2='8'%20stroke='rgba(56,70,75,0.22)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='17'%20x2='11'%20y2='17'%20stroke='rgba(56,70,75,0.38)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='17'%20x2='24'%20y2='17'%20stroke='rgba(56,70,75,0.38)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='20'%20x2='11'%20y2='20'%20stroke='rgba(56,70,75,0.22)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='20'%20x2='24'%20y2='20'%20stroke='rgba(56,70,75,0.22)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='5'%20y1='0'%20x2='5'%20y2='24'%20stroke='rgba(56,70,75,0.28)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='8'%20y1='0'%20x2='8'%20y2='24'%20stroke='rgba(56,70,75,0.16)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='0'%20x2='17'%20y2='3'%20stroke='rgba(56,70,75,0.28)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='10'%20x2='17'%20y2='24'%20stroke='rgba(56,70,75,0.28)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='0'%20x2='20'%20y2='3'%20stroke='rgba(56,70,75,0.16)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='10'%20x2='20'%20y2='24'%20stroke='rgba(56,70,75,0.16)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3C/svg%3E\")";
const BASKET_WEAVE_LIGHT =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%3E%3Cline%20x1='0'%20y1='5'%20x2='24'%20y2='5'%20stroke='rgba(56,70,75,0.12)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='8'%20x2='24'%20y2='8'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='17'%20x2='11'%20y2='17'%20stroke='rgba(56,70,75,0.12)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='17'%20x2='24'%20y2='17'%20stroke='rgba(56,70,75,0.12)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='20'%20x2='11'%20y2='20'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='20'%20x2='24'%20y2='20'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='5'%20y1='0'%20x2='5'%20y2='24'%20stroke='rgba(56,70,75,0.09)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='8'%20y1='0'%20x2='8'%20y2='24'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='0'%20x2='17'%20y2='3'%20stroke='rgba(56,70,75,0.09)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='10'%20x2='17'%20y2='24'%20stroke='rgba(56,70,75,0.09)'%20stroke-width='2.2'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='0'%20x2='20'%20y2='3'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='10'%20x2='20'%20y2='24'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='1.0'%20stroke-linecap='square'/%3E%3C/svg%3E\")";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/reset-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="grid lg:grid-cols-2 min-h-screen">
        <div className="hidden lg:block bg-gradient-to-br from-primary-deep to-primary" />
        <div className="bg-surface dark:bg-dark-bg p-8 md:p-12 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm space-y-6 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1">Check Your Email</h1>
            <p className="text-sm text-text-3 dark:text-dark-text-3">
              We&apos;ve sent a password reset link to <strong className="text-text-1 dark:text-dark-text-1">{email}</strong>
            </p>
            <Link
              href="/login"
              className="block w-full bg-accent text-charcoal font-bold text-sm py-3.5 rounded-md shadow-accent hover:bg-accent-hover transition-all text-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 min-h-screen">
      {/* Left Panel — same as login/signup */}
      <div className="bg-gradient-to-br from-primary-deep to-primary p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backgroundImage: BASKET_WEAVE_DARK,
            backgroundSize: "24px 24px",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.85) 82%, black 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.85) 82%, black 100%)",
          }}
        />
        <div className="relative z-20">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src={LOGO_URL} alt="KOMPLEET" width={40} height={40} className="rounded-lg shadow-4" />
            <span className="font-ceoruse text-xl font-bold text-white">KOMPLEET</span>
          </Link>
        </div>
        <div className="relative z-20">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight tracking-tighter">
            Control Your Money.
            <br />
            <em className="text-accent not-italic">Grow Your Business.</em>
          </h2>
          <p className="text-base text-white/50 mt-4 max-w-sm">
            The financial operating system for Nigerian SMEs.
          </p>
        </div>
      </div>

      {/* Right Panel — form */}
      <div className="bg-surface dark:bg-dark-bg p-8 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backgroundImage: BASKET_WEAVE_LIGHT,
            backgroundSize: "24px 24px",
            maskImage:
              "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 50%, rgba(0,0,0,0.3) 68%, rgba(0,0,0,0.7) 84%, black 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 75% at 50% 50%, transparent 50%, rgba(0,0,0,0.3) 68%, rgba(0,0,0,0.7) 84%, black 100%)",
          }}
        />
        <div className="absolute top-6 left-6 z-20">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-text-3 dark:text-dark-text-3 hover:text-text-1 dark:hover:text-dark-text-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
        <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
          <Link href="/#features" className="text-xs font-medium text-text-2 dark:text-dark-text-2 hover:text-primary">Features</Link>
          <Link href="/contact" className="text-xs font-medium text-text-2 dark:text-dark-text-2 hover:text-primary">Contact</Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-md border border-border dark:border-dark-border hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>

        <div className="w-full max-w-sm relative z-20 mt-12">
          <div className="flex items-center justify-center gap-3 mb-6 lg:hidden">
            <Image src={LOGO_URL} alt="KOMPLEET" width={40} height={40} className="rounded-lg shadow-4" />
            <span className="font-ceoruse text-xl font-bold text-text-1 dark:text-dark-text-1">KOMPLEET</span>
          </div>
          <div className="text-center mb-2">
            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-7 h-7 text-accent" />
            </div>
            <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1 mb-2">Reset your password</h1>
            <p className="text-sm text-text-3 dark:text-dark-text-3 mb-6">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-md bg-error-bg dark:bg-error-darkBg border border-error/30 text-error dark:text-error-dark text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label htmlFor="email" className="text-xs font-bold text-text-2 dark:text-dark-text-2 uppercase tracking-wider">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                className="w-full mt-2 bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md p-3 text-sm text-text-1 dark:text-dark-text-1 focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-charcoal font-bold text-sm py-3.5 rounded-md shadow-accent hover:bg-accent-hover transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="text-center text-xs text-text-4 dark:text-dark-text-4 mt-6">
            Secure link expires in 60 minutes for your protection.
          </p>
        </div>
      </div>
    </div>
  );
}
