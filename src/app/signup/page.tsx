'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Moon, Shield, Lock, Sun, ShieldCheck, Zap, TrendingUp } from 'lucide-react';

const LIFESTYLE_PHOTO = "/assets/auth-lifestyle.jpg";

const TRUST_BULLETS = [
  { icon: ShieldCheck, label: "Bank-grade encryption & NDPR compliant" },
  { icon: Zap,         label: "Real-time expense tracking, zero lag" },
  { icon: TrendingUp,  label: "Built for Nigerian SMEs — free during Beta" },
];

function getPasswordStrength(pw: string) {
  const checks = { minLength: pw.length >= 8, hasNumber: /\d/.test(pw) };
  const passed = Object.values(checks).filter(Boolean).length;
  let label: string, color: string, width: string;
  if (passed === 0) { label = 'Weak'; color = 'bg-red-400'; width = '33%'; }
  else if (passed === 1) { label = 'Fair'; color = 'bg-yellow-400'; width = '66%'; }
  else { label = 'Strong'; color = 'bg-primary'; width = '100%'; }
  return { label, color, width };
}

export default function SignUpPage() {
  const router = useRouter();
  const { resolvedTheme, toggleTheme } = useTheme();
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
    if (password.length < 8) { setError('Password must be at least 8 characters long'); setLoading(false); return; }
    if (!/\d/.test(password)) { setError('Password must contain at least one number'); setLoading(false); return; }
    try {
      const supabase = createSupabaseClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: businessEmail,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`, business_name: businessName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) { setError(authError.message); setLoading(false); return; }
      if (data.user) setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* LEFT: Form panel */}
      <div className="flex flex-col min-h-screen bg-white dark:bg-dark-bg px-8 py-10 md:px-14">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
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
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-dark-text-1 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-500 dark:text-dark-text-3 mb-6">
                We sent a confirmation link to <strong>{businessEmail}</strong>. Click it to activate your account.
              </p>
              <button onClick={() => router.push('/login')} className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3.5 rounded-full transition-all">
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-primary dark:text-accent uppercase tracking-widest mb-2">Get started free</p>
              <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-dark-text-1 mb-1">Create your account</h1>
              <p className="text-sm text-gray-500 dark:text-dark-text-3 mb-7">Join thousands of Nigerian businesses managing their finances smarter.</p>

              {error && (
                <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-dark-text-2 mb-1.5">First Name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Tunde"
                      className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full px-4 py-3 text-sm text-gray-900 dark:text-dark-text-1 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-dark-text-2 mb-1.5">Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Adeyemi"
                      className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full px-4 py-3 text-sm text-gray-900 dark:text-dark-text-1 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-dark-text-2 mb-1.5">Business Name</label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required placeholder="e.g. Tunde Ventures Ltd"
                    className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full px-5 py-3 text-sm text-gray-900 dark:text-dark-text-1 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-dark-text-2 mb-1.5">Business Email</label>
                  <input type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} required placeholder="name@company.ng"
                    className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full px-5 py-3 text-sm text-gray-900 dark:text-dark-text-1 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-dark-text-2 mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Minimum 8 characters"
                      className="w-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-full px-5 py-3 pr-12 text-sm text-gray-900 dark:text-dark-text-1 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text-1">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1 bg-gray-100 dark:bg-dark-surface-2 rounded-full overflow-hidden">
                        <div className={`h-full ${strength.color} rounded-full transition-all duration-300`} style={{ width: strength.width }} />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-dark-text-4">Strength: <span className="font-semibold text-gray-600 dark:text-dark-text-2">{strength.label}</span></p>
                    </div>
                  )}
                </div>
                <div className="pt-1">
                  <button type="submit" disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3.5 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2">
                    {loading ? 'Creating account…' : 'Create Free Account'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              <p className="text-xs text-center text-gray-400 dark:text-dark-text-4 mt-4">
                By signing up you agree to our{' '}
                <Link href="/kompleet-terms.html" className="text-primary hover:underline">Terms</Link>{' '}and{' '}
                <Link href="/kompleet-privacy.html" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
              <div className="mt-5 pt-5 border-t border-gray-100 dark:border-dark-border flex items-center justify-center gap-5 text-xs text-gray-400 dark:text-dark-text-4">
                <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /><span>NDPR Compliant</span></div>
                <div className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /><span>256-bit SSL</span></div>
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-dark-text-3 mt-5">
                Already have an account?{' '}
                <Link href="/login" className="font-bold text-primary hover:underline">Sign in</Link>
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
