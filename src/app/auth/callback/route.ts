/**
 * Auth Callback Route Handler
 * 
 * Handles OAuth callbacks and email confirmation links from Supabase.
 * Exchanges the auth code for a session and redirects to the dashboard.
 */

import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect') || '/dashboard';

  if (code) {
    try {
      const supabase = await createServerClient();
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Auth callback error:', error.message);
        return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
      }

      // Verify session was created
      if (!data.session) {
        console.error('No session created after code exchange');
        return NextResponse.redirect(new URL('/login?error=no_session', requestUrl.origin));
      }

      // Create response with redirect
      const response = NextResponse.redirect(new URL(redirect, requestUrl.origin));
      
      // Ensure cookies are set by refreshing the session
      await supabase.auth.getSession();
      
      return response;
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
      return NextResponse.redirect(new URL('/login?error=unexpected', requestUrl.origin));
    }
  }

  // No code present - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
