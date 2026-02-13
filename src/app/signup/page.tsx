'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';

function getPasswordStrength(pw: string) {
  const checks = {
    minLength: pw.length >= 6,
    hasUpper: /[A-Z]/.test(pw),
    hasNumber: /\d/.test(pw),
    hasSpecial: /[^A-Za-z0-9]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let label: string;
  let color: string;
  let width: string;
  if (passed <= 1) { label = 'Weak'; color = 'bg-error-dark'; width = '25%'; }
  else if (passed === 2) { label = 'Fair'; color = 'bg-warning-dark'; width = '50%'; }
  else if (passed === 3) { label = 'Good'; color = 'bg-info-dark'; width = '75%'; }
  else { label = 'Strong'; color = 'bg-success-dark'; width = '100%'; }
  return { checks, passed, label, color, width };
}

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes('weak') || msg.includes('password')) {
          setError('Password is too weak. Try adding uppercase letters, numbers, and special characters.');
        } else {
          setError(authError.message);
        }
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
      <div className="min-h-screen flex items-center justify-center bg-dark-background dark">
        <div className="w-full max-w-md p-8">
          <div className="solid-card bg-dark-surface border-dark-border p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-dark-text-primary mb-2">Account Created!</h1>
              <p className="text-dark-text-secondary">
                Your account has been created successfully.
              </p>
            </div>

            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4 mb-6">
              <p className="text-dark-text-secondary text-sm">
                Check your email for a confirmation link, or if email confirmation is disabled, 
                you'll be redirected to the dashboard shortly.
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
          <h1 className="text-2xl font-bold text-dark-text-primary mb-2">Create your account</h1>
          <p className="text-dark-text-secondary mb-6">Get started with KOMPLEET today</p>

          {error && (
            <div className="mb-4 p-3 bg-error-dark/10 border border-error-dark/20 rounded-lg">
              <p className="text-error-dark text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-dark-text-secondary mb-2">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-dark-surface-hover border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>

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
              <label htmlFor="password" className="block text-sm font-medium text-dark-text-secondary mb-2">
                Password
              </label>
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
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-dark-text-tertiary">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      strength.label === 'Weak' ? 'text-error-dark' :
                      strength.label === 'Fair' ? 'text-warning-dark' :
                      strength.label === 'Good' ? 'text-info-dark' :
                      'text-success-dark'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-2 bg-dark-surface-hover rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className={`text-xs flex items-center gap-2 ${strength.checks.minLength ? 'text-success-dark' : 'text-dark-text-tertiary'}`}>
                      <span className="material-icons text-xs">{strength.checks.minLength ? 'check_circle' : 'radio_button_unchecked'}</span>
                      At least 6 characters
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${strength.checks.hasUpper ? 'text-success-dark' : 'text-dark-text-tertiary'}`}>
                      <span className="material-icons text-xs">{strength.checks.hasUpper ? 'check_circle' : 'radio_button_unchecked'}</span>
                      One uppercase letter
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${strength.checks.hasNumber ? 'text-success-dark' : 'text-dark-text-tertiary'}`}>
                      <span className="material-icons text-xs">{strength.checks.hasNumber ? 'check_circle' : 'radio_button_unchecked'}</span>
                      One number
                    </div>
                    <div className={`text-xs flex items-center gap-2 ${strength.checks.hasSpecial ? 'text-success-dark' : 'text-dark-text-tertiary'}`}>
                      <span className="material-icons text-xs">{strength.checks.hasSpecial ? 'check_circle' : 'radio_button_unchecked'}</span>
                      One special character (recommended)
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-text-secondary mb-2">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-dark-text-secondary">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-500 hover:text-primary-400 font-medium transition-colors">
                Sign in
              </Link>
            </p>
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
