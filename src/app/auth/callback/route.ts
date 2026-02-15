/**
 * Auth Callback Route Handler
 * 
 * Handles OAuth callbacks and email confirmation links from Supabase.
 * Exchanges the auth code for a session and redirects to the dashboard.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  // Support both 'next' and 'redirect' query params for the target page
  const next = requestUrl.searchParams.get('next')
    || requestUrl.searchParams.get('redirect')
    || '/dashboard';

  // Validate redirect target to prevent open redirect attacks
  const safeNext = next.startsWith('/') ? next : '/dashboard';

  if (code) {
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

      // Redirect to the target page
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
      return NextResponse.redirect(new URL('/login?error=unexpected', requestUrl.origin));
    }
  }

  // No code present - redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
