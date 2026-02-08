'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1B5E4F 0%, #0D3D34 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle Nigerian pattern overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(255, 255, 255, 0.03) 35px,
            rgba(255, 255, 255, 0.03) 70px
          )`,
          pointerEvents: 'none',
        }}
      />

      {/* Glassmorphism container */}
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '32px',
          padding: '48px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 16px',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            }}
          >
            <span style={{ fontSize: '42px', fontWeight: 'bold', color: '#1B5E4F' }}>K</span>
          </div>
          <h1
            style={{
              fontSize: '42px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginBottom: '8px',
              letterSpacing: '1px',
            }}
          >
            KOMPLEET
          </h1>
          <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)' }}>
            Sign in to your account
          </p>
        </div>

        {/* Auth UI */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '32px',
          }}
        >
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#1B5E4F',
                    brandAccent: '#0D3D34',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#F5F5F5',
                    defaultButtonBackgroundHover: '#E0E0E0',
                    inputBackground: '#FFFFFF',
                    inputBorder: '#E0E0E0',
                    inputBorderHover: '#1B5E4F',
                    inputBorderFocus: '#1B5E4F',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '12px',
                    buttonBorderRadius: '12px',
                    inputBorderRadius: '12px',
                  },
                },
              },
              style: {
                button: {
                  fontSize: '16px',
                  padding: '12px 24px',
                  fontWeight: '600',
                },
                input: {
                  fontSize: '16px',
                  padding: '12px 16px',
                },
                label: {
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#333333',
                },
                anchor: {
                  color: '#1B5E4F',
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
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          Professional tax compliance and financial management platform for Nigerian businesses
        </p>
      </div>
    </div>
  );
}
