'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

function getPasswordStrength(pw: string) {
  const checks = {
    minLength: pw.length >= 8,
    hasNumber: /\d/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let label: string;
  let color: string;
  let width: string;
  if (passed === 0) { label = 'Weak'; color = 'bg-error-500'; width = '33%'; }
  else if (passed === 1) { label = 'Fair'; color = 'bg-warning-500'; width = '66%'; }
  else { label = 'Strong'; color = 'bg-success-500'; width = '100%'; }
  return { checks, passed, label, color, width };
}

export default function SignUpPage() {
  const router = useRouter();
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

    // Validate password strength
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
        // If email confirmation is disabled, redirect to dashboard
        if (data.session) {
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 2000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background">
        <div className="w-full max-w-md p-6">
          <div className="solid-card bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border p-8 rounded-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">Account Created!</h1>
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                Check your email to verify your account.
              </p>
            </div>

            <Link 
              href="/login"
              className="btn-primary block w-full text-center"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-background dark:bg-dark-background p-6">
      <div className="w-full max-w-lg">
        {/* Logo - Top Left in Dark Mode, Centered in Light Mode */}
        <div className="mb-8 dark:mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
            <span className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">KOMPLEET</span>
          </Link>
        </div>

        {/* Card - Solid Design */}
        <div className="solid-card bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border p-8 rounded-xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
              Create your account
            </h1>
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              Join 5,000+ Nigerian businesses automating their tax compliance today.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-500/10 border border-error-500/20 rounded-lg">
              <p className="text-error-500 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name and Last Name - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-light-surface-hover dark:bg-dark-surface-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="e.g. Tunde"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-light-surface-hover dark:bg-dark-surface-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="e.g. Balogun"
                />
              </div>
            </div>

            {/* Business Email */}
            <div>
              <label htmlFor="businessEmail" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                Business Email
              </label>
              <input
                id="businessEmail"
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-light-surface-hover dark:bg-dark-surface-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="name@company.com"
              />
            </div>

            {/* Password with Toggle */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 bg-light-surface-hover dark:bg-dark-surface-hover border border-light-border dark:border-dark-border rounded-lg text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-secondary dark:hover:text-dark-text-secondary transition-colors"
                >
                  <span className="material-icons text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="mt-2 text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
                Minimum 8 characters with at least one number
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Creating account...' : 'Create Free Account'}
              {!loading && <span className="material-icons text-lg">arrow_forward</span>}
            </button>
          </form>

          {/* Terms */}
          <div className="mt-4 text-center">
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-primary-500 hover:text-primary-400 transition-colors">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary-500 hover:text-primary-400 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 pt-6 border-t border-light-border dark:border-dark-border">
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <span className="material-icons text-primary-500 text-sm">verified_user</span>
                </div>
                <span className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
                  NDPR COMPLIANT
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <span className="material-icons text-primary-500 text-sm">lock</span>
                </div>
                <span className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
                  256-BIT AES
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Copyright */}
        <div className="mt-6 text-center">
          <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
            © 2024 KOMPLEET Financial. Licensed by the relevant authorities.
          </p>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            <Link href="/help" className="text-light-text-tertiary dark:text-dark-text-tertiary hover:text-primary-500 transition-colors">
              Help Center
            </Link>
            <Link href="/security" className="text-light-text-tertiary dark:text-dark-text-tertiary hover:text-primary-500 transition-colors">
              Security
            </Link>
            <Link href="/contact" className="text-light-text-tertiary dark:text-dark-text-tertiary hover:text-primary-500 transition-colors">
              Contact
            </Link>
          </div>
        </div>

        {/* Already have account link - Top Right in Dark Mode */}
        <div className="hidden dark:block absolute top-6 right-6">
          <p className="text-sm text-dark-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
              Log in
            </Link>
          </p>
        </div>

        {/* Already have account link - Bottom in Light Mode */}
        <div className="dark:hidden mt-6 text-center">
          <p className="text-sm text-light-text-secondary">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
