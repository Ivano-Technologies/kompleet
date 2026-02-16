/**
 * Auth Callback Route Handler
 * 
 * Handles OAuth callbacks, email confirmation links, and password reset links from Supabase.
 * Exchanges the auth code for a session and redirects to the appropriate page.
 * 
 * Supported flows:
 * - OAuth login (Google, etc.)
 * - Email confirmation
 * - Password reset
 * - Magic link login
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token = requestUrl.searchParams.get('token');
  const type = requestUrl.searchParams.get('type');
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle Supabase auth errors
  if (error) {
    console.error('Supabase auth error:', error, errorDescription);
    
    // Map Supabase errors to user-friendly messages
    const errorMap: Record<string, string> = {
      'access_denied': 'access_denied',
      'server_error': 'server_error',
      'temporarily_unavailable': 'temporarily_unavailable',
      'invalid_request': 'invalid_request',
    };
    
    const mappedError = errorMap[error] || 'auth_failed';
    return NextResponse.redirect(
      new URL(`/login?error=${mappedError}&details=${encodeURIComponent(errorDescription || '')}`, requestUrl.origin)
    );
  }

  // Check if this is a password recovery flow
  const isPasswordRecovery = type === 'recovery' && token;
  
  // No code and not a recovery token - invalid callback
  if (!code && !isPasswordRecovery) {
    console.error('Auth callback called without code or recovery token');
    return NextResponse.redirect(new URL('/login?error=missing_code', requestUrl.origin));
  }

  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create Supabase client with cookie handling
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });
    
    // Handle password recovery flow
    if (isPasswordRecovery) {
      console.log('Password recovery flow initiated');
      
      // Verify the recovery token by exchanging it
      const { data: recoveryData, error: recoveryError } = await supabase.auth.exchangeCodeForSession(token);
      
      if (recoveryError) {
        console.error('Password recovery token error:', recoveryError.message);
        
        if (recoveryError.message.includes('expired')) {
          return NextResponse.redirect(
            new URL('/login?error=expired_link&message=Password reset link has expired. Please request a new one.', requestUrl.origin)
          );
        }
        
        return NextResponse.redirect(
          new URL('/login?error=invalid_recovery_link&message=Invalid password reset link. Please request a new one.', requestUrl.origin)
        );
      }
      
      // Redirect to reset-password page with the session established
      return NextResponse.redirect(new URL('/reset-password', requestUrl.origin));
    }
    
    // Standard OAuth/email confirmation flow
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Auth callback exchange error:', exchangeError.message);
      
      // Handle specific error cases
      if (exchangeError.message.includes('expired')) {
        return NextResponse.redirect(
          new URL('/login?error=expired_link&message=This link has expired. Please request a new one.', requestUrl.origin)
        );
      }
      
      if (exchangeError.message.includes('already used')) {
        return NextResponse.redirect(
          new URL('/login?error=link_used&message=This link has already been used. Please request a new one.', requestUrl.origin)
        );
      }
      
      return NextResponse.redirect(
        new URL('/login?error=auth_failed&message=Authentication failed. Please try again.', requestUrl.origin)
      );
    }

    // Verify session was created
    if (!data.session) {
      console.error('No session created after code exchange');
      return NextResponse.redirect(
        new URL('/login?error=no_session&message=Failed to create session. Please try again.', requestUrl.origin)
      );
    }

    // Log successful authentication
    const authType = redirect.includes('reset-password') ? 'password_reset' : 'login';
    console.log(`Auth callback success - Type: ${authType}, User: ${data.user?.email}, Redirect: ${redirect}`);

    // Validate redirect URL to prevent open redirect vulnerabilities
    const allowedRedirects = [
      '/dashboard',
      '/reset-password',
      '/profile',
      '/settings',
      '/transactions',
      '/invoices',
      '/reports',
      '/calculators',
      '/filing',
      '/categories',
    ];
    
    // Check if redirect starts with any allowed path
    const isAllowedRedirect = allowedRedirects.some(allowed => redirect.startsWith(allowed));
    
    if (!isAllowedRedirect) {
      console.warn(`Invalid redirect URL attempted: ${redirect}, defaulting to /dashboard`);
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }

    // Redirect to the target page
    return NextResponse.redirect(new URL(redirect, requestUrl.origin));
  } catch (err) {
    console.error('Unexpected error in auth callback:', err);
    return NextResponse.redirect(
      new URL('/login?error=unexpected&message=An unexpected error occurred. Please try again.', requestUrl.origin)
    );
  }
}
