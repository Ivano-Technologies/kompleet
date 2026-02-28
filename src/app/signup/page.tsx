'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Moon, Shield, Lock, Sun } from 'lucide-react';

const LOGO_URL = "/logo.png";

// Basket weave — dark panel variant (very subtle, edge-only via mask)
const BASKET_WEAVE_DARK =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%3E%3Cline%20x1='0'%20y1='5'%20x2='24'%20y2='5'%20stroke='rgba(255,255,255,0.10)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='8'%20x2='24'%20y2='8'%20stroke='rgba(255,255,255,0.05)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='17'%20x2='11'%20y2='17'%20stroke='rgba(255,255,255,0.10)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='17'%20x2='24'%20y2='17'%20stroke='rgba(255,255,255,0.10)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='20'%20x2='11'%20y2='20'%20stroke='rgba(255,255,255,0.05)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='20'%20x2='24'%20y2='20'%20stroke='rgba(255,255,255,0.05)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3Cline%20x1='5'%20y1='0'%20x2='5'%20y2='24'%20stroke='rgba(255,255,255,0.08)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='8'%20y1='0'%20x2='8'%20y2='24'%20stroke='rgba(255,255,255,0.04)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='0'%20x2='17'%20y2='3'%20stroke='rgba(255,255,255,0.08)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='10'%20x2='17'%20y2='24'%20stroke='rgba(255,255,255,0.08)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='0'%20x2='20'%20y2='3'%20stroke='rgba(255,255,255,0.04)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='10'%20x2='20'%20y2='24'%20stroke='rgba(255,255,255,0.04)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3C/svg%3E\")";

// Basket weave — light panel variant (charcoal threads, very faint)
const BASKET_WEAVE_LIGHT =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%3E%3Cline%20x1='0'%20y1='5'%20x2='24'%20y2='5'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='8'%20x2='24'%20y2='8'%20stroke='rgba(56,70,75,0.03)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='17'%20x2='11'%20y2='17'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='17'%20x2='24'%20y2='17'%20stroke='rgba(56,70,75,0.07)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='0'%20y1='20'%20x2='11'%20y2='20'%20stroke='rgba(56,70,75,0.03)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3Cline%20x1='13'%20y1='20'%20x2='24'%20y2='20'%20stroke='rgba(56,70,75,0.03)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3Cline%20x1='5'%20y1='0'%20x2='5'%20y2='24'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='8'%20y1='0'%20x2='8'%20y2='24'%20stroke='rgba(56,70,75,0.02)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='0'%20x2='17'%20y2='3'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='17'%20y1='10'%20x2='17'%20y2='24'%20stroke='rgba(56,70,75,0.05)'%20stroke-width='2.0'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='0'%20x2='20'%20y2='3'%20stroke='rgba(56,70,75,0.02)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3Cline%20x1='20'%20y1='10'%20x2='20'%20y2='24'%20stroke='rgba(56,70,75,0.02)'%20stroke-width='0.8'%20stroke-linecap='square'/%3E%3C/svg%3E\")";

function getPasswordStrength(pw: string) {
  const checks = { minLength: pw.length >= 8, hasNumber: /\d/.test(pw) };
  const passed = Object.values(checks).filter(Boolean).length;
  let label: string, color: string, width: string;
  if (passed === 0) { label = 'Weak'; color = 'bg-error'; width = '33%'; }
  else if (passed === 1) { label = 'Fair'; color = 'bg-warning'; width = '66%'; }
  else { label = 'Strong'; color = 'bg-success'; width = '100%'; }
  return { checks, passed, label, color, width };
}

export default function SignUpPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: businessEmail,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            business_name: businessName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-dark-bg">
        <div className="w-full max-w-md p-6">
          <div className="bg-surface dark:bg-dark-surface border border-border dark:border-dark-border p-8 rounded-lg text-center shadow-3">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success dark:text-success-dark" />
            </div>
            <h1 className="font-display text-2xl font-bold text-text-1 dark:text-dark-text-1 mb-2">Account Created!</h1>
            <p className="text-text-3 dark:text-dark-text-3 mb-6">
              Check your email to verify your account before signing in.
            </p>
            <Link href="/login" className="bg-primary text-white font-bold text-sm py-3 px-6 rounded-md block w-full text-center hover:bg-primary-deep transition-colors">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 min-h-screen">
      {/* Left Panel — Ocean Blue brand panel with basket weave edge imprint */}
      <div className="hidden lg:flex bg-gradient-to-br from-primary-deep to-primary p-8 md:p-12 flex-col justify-between relative overflow-hidden">
        {/* Basket weave — edge-only, fades to nothing at centre */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backgroundImage: BASKET_WEAVE_DARK,
            backgroundSize: '24px 24px',
            maskImage:
              'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.85) 82%, black 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.4) 65%, rgba(0,0,0,0.85) 82%, black 100%)',
          }}
        />
        {/* Logo */}
        <div className="relative z-20">
          <Link href="/" className="flex items-center gap-3">
            <Image src={LOGO_URL} alt="KOMPLEET" width={40} height={40} className="rounded-lg shadow-4" />
            <span className="font-ceoruse text-xl font-bold text-white">KOMPLEET</span>
          </Link>
        </div>
        {/* Brand copy */}
        <div className="relative z-20 space-y-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight tracking-tighter">
            Control Your Money.
            <br />
            <em className="text-accent not-italic">Grow</em> Your Business.
          </h2>
          <p className="text-base text-white/50 max-w-sm">
            The financial operating system for Nigerian SMEs.
          </p>
        </div>

      </div>

      {/* Right Panel — form with very subtle basket weave at edges */}
      <div className="bg-surface dark:bg-dark-bg flex flex-col relative overflow-hidden">
        {/* Basket weave — right panel, edge-only, very faint */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            backgroundImage: BASKET_WEAVE_LIGHT,
            backgroundSize: '24px 24px',
            maskImage:
              'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 50%, rgba(0,0,0,0.3) 68%, rgba(0,0,0,0.7) 84%, black 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 50%, rgba(0,0,0,0.3) 68%, rgba(0,0,0,0.7) 84%, black 100%)',
          }}
        />
        {/* Top bar */}
        <div className="relative z-20 flex items-center justify-between p-6 border-b border-border dark:border-dark-border">
          <Link href="/" className="flex items-center gap-2 text-sm text-text-3 dark:text-dark-text-3 hover:text-text-1 dark:hover:text-dark-text-1 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-3 dark:text-dark-text-3">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-primary hover:underline">Log in</Link>
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md border border-border dark:border-dark-border hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="relative z-20 flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <Image src={LOGO_URL} alt="KOMPLEET" width={32} height={32} className="rounded" />
              <span className="font-ceoruse text-lg font-bold text-text-1 dark:text-dark-text-1">KOMPLEET</span>
            </div>

            <div className="mb-8">
              <div className="text-xs font-bold text-text-4 dark:text-dark-text-4 uppercase tracking-widest mb-2">
                Create Account
              </div>
              <h1 className="font-display text-3xl font-bold text-text-1 dark:text-dark-text-1 mb-2">
                Get Started for Free
              </h1>
              <p className="text-sm text-text-3 dark:text-dark-text-3">
                Join 5,000+ Nigerian businesses automating their tax compliance.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-md bg-error-bg dark:bg-error-darkBg border border-error/30 text-error dark:text-error-dark text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-2 dark:text-dark-text-2 uppercase tracking-wider">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="e.g. Tunde"
                    className="w-full mt-2 bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md p-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 text-text-1 dark:text-dark-text-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-2 dark:text-dark-text-2 uppercase tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="e.g. Balogun"
                    className="w-full mt-2 bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md p-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 text-text-1 dark:text-dark-text-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-2 dark:text-dark-text-2 uppercase tracking-wider">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  placeholder="e.g. Tunde Ventures Ltd"
                  className="w-full mt-2 bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md p-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 text-text-1 dark:text-dark-text-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-2 dark:text-dark-text-2 uppercase tracking-wider">
                  Business Email
                </label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  required
                  placeholder="name@company.ng"
                  className="w-full mt-2 bg-surface dark:bg-dark-surface border-2 border-border dark:border-dark-border rounded-md p-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 text-text-1 dark:text-dark-text-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-2 dark:text-dark-text-2 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative mt-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className="w-full pr-10 bg-surface-2 dark:bg-dark-surface-2 border-2 border-border dark:border-dark-border rounded-md p-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 text-text-1 dark:text-dark-text-1"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-4 dark:text-dark-text-4 hover:text-text-1 dark:hover:text-dark-text-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1 bg-surface-2 dark:bg-dark-surface-2 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
                    </div>
                    <p className="text-xs text-text-4 dark:text-dark-text-4">
                      Password strength: <span className="font-semibold">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-charcoal font-bold text-sm py-3.5 rounded-md shadow-accent hover:bg-accent-hover transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
              >
                {loading ? 'Creating account…' : 'Create Free Account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="text-xs text-center text-text-4 dark:text-dark-text-4 mt-5">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>

            {/* Trust badges */}
            <div className="mt-6 pt-5 border-t border-border dark:border-dark-border">
              <div className="flex items-center justify-center gap-5 text-xs text-text-4 dark:text-dark-text-4">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>NDPR Compliant</span>
                </div>
                <div className="flex items-center gap-1.5">
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
