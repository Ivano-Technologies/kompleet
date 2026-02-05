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
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Auth callback error:', error.message);
        return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
      }

      // Successful authentication - redirect to intended destination
      return NextResponse.redirect(new URL(redirect, requestUrl.origin));
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
      return NextResponse.redirect(new URL('/login?error=unexpected', requestUrl.origin));
    }
  }

  // No code present - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
