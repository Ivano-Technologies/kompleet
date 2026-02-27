'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Moon, Shield, Lock, Sun } from 'lucide-react';

const LOGO_URL =
  "/logo.png";

function getPasswordStrength(pw: string) {
  const checks = { minLength: pw.length >= 8, hasNumber: /\d/.test(pw) };
  const passed = Object.values(checks).filter(Boolean).length;
  let label: string, color: string, width: string;
  if (passed === 0) { label = 'Weak'; color = 'bg-red-500'; width = '33%'; }
  else if (passed === 1) { label = 'Fair'; color = 'bg-yellow-500'; width = '66%'; }
  else { label = 'Strong'; color = 'bg-green-500'; width = '100%'; }
  return { checks, passed, label, color, width };
}

export default function SignUpPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
        // Always show "check your email" — do not auto-redirect to dashboard.
        // Users must verify their email before accessing the app.
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--background))]">
        <div className="w-full max-w-md p-6">
          <div className="solid-card p-8 rounded-xl text-center">
            <div className="w-16 h-16 bg-[rgba(var(--primary-rgb),0.15)] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[rgb(var(--primary))]" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Account Created!</h1>
            <p className="text-[rgb(var(--text-secondary))] mb-6">
              Check your email to verify your account.
            </p>
            <Link href="/login" className="btn-primary block w-full text-center">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            Start automating<br />your finances today.
          </h2>
          <p className="text-white/70 text-base max-w-sm leading-relaxed">
            Create your free account and join thousands of Nigerian businesses already saving time on tax compliance.
          </p>
          <div className="flex gap-6 text-white/60 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" /> Free 14-day trial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60" /> No credit card
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-[rgb(var(--text-secondary))]">
              Already have an account?{' '}
              <Link href="/login" className="text-[rgb(var(--primary))] font-medium hover:underline">Log in</Link>
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--surface))] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <Image src={LOGO_URL} alt="KOMPLEET" width={32} height={32} className="rounded" />
              <span className="text-lg font-bold">KOMPLEET</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Create your account</h1>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                Join 5,000+ Nigerian businesses automating their tax compliance.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="e.g. Tunde"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="e.g. Balogun"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="businessEmail" className="text-sm font-medium">Business Email</label>
                <input
                  id="businessEmail"
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
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
                {password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="h-1.5 bg-[rgb(var(--surface))] rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
                    </div>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">
                      Password strength: <span className="font-medium">{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Creating account...' : 'Create Free Account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="text-xs text-center text-[rgb(var(--text-tertiary))]">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-[rgb(var(--primary))] hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[rgb(var(--primary))] hover:underline">Privacy Policy</Link>
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
