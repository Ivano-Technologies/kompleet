'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Logo } from '@/components/nextauth-ui';

/**
 * KOMPLEET Sign-In Page - NextAuth Design
 * 
 * Features:
 * - Centered card layout
 * - Pure black/white background
 * - Flat design (no glassmorphism, no shadows)
 * - Nigerian green accents
 * - Magic link authentication
 */
export default function SignInPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-[#11211b] flex flex-col items-center justify-center p-4 dark">
      {/* Logo Link */}
      <Link href="/" className="mb-8">
        <Logo text="KOMPLEET" imageSrc="/assets/logo-primary.png" />
      </Link>

      {/* Sign-In Card */}
      <div className="w-full max-w-md bg-light-surface dark:bg-dark-surface/5 border border-[#0a6746]/20 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back
          </h1>
          <p className="text-light-text-tertiary dark:text-dark-text-tertiary">
            Sign in to your account
          </p>
        </div>

        {/* Supabase Auth UI with NextAuth styling */}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#008751', // Nigerian green
                  brandAccent: '#006B3F',
                  brandButtonText: 'white',
                  defaultButtonBackground: 'transparent',
                  defaultButtonBackgroundHover: 'transparent',
                  inputBackground: 'rgb(var(--surface))',
                  inputBorder: 'rgb(var(--border))',
                  inputBorderHover: '#008751',
                  inputBorderFocus: '#008751',
                  inputText: 'rgb(var(--foreground))',
                  inputLabelText: 'rgb(var(--foreground))',
                  inputPlaceholder: 'rgb(var(--muted))',
                },
                borderWidths: {
                  buttonBorderWidth: '1px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '24px',
                  buttonBorderRadius: '24px',
                  inputBorderRadius: '8px',
                },
                fonts: {
                  bodyFontFamily: 'var(--font-inter), system-ui, sans-serif',
                  buttonFontFamily: 'var(--font-inter), system-ui, sans-serif',
                  inputFontFamily: 'var(--font-inter), system-ui, sans-serif',
                  labelFontFamily: 'var(--font-inter), system-ui, sans-serif',
                },
              },
            },
            style: {
              button: {
                fontSize: '16px',
                padding: '12px 32px',
                fontWeight: '600',
                transition: 'all 200ms',
              },
              input: {
                fontSize: '16px',
                padding: '12px 16px',
              },
              label: {
                fontSize: '14px',
                fontWeight: '500',
              },
              anchor: {
                color: '#008751',
                fontWeight: '600',
              },
            },
          }}
          providers={[]} // No OAuth providers - magic link only
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://techivano.com'}/auth/callback`}
          view="magic_link" // Magic link authentication only
          showLinks={false} // Hide sign up link for now
          magicLink={true}
        />

        {/* Footer Text */}
        <p className="text-center text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-8">
          Professional tax compliance platform for Nigerian businesses
        </p>
      </div>

      {/* Back to Home Link */}
      <Link
        href="/"
        className="mt-6 text-sm text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-tertiary dark:text-dark-text-tertiary transition-colors duration-200"
      >
        ← Back to home
      </Link>
    </div>
  );
}
