/**
 * Next.js Proxy - Auth Guard
 * 
 * This proxy enforces authentication on protected routes.
 * It runs on the Edge runtime for optimal performance.
 * 
 * Route categories:
 * - Public: Accessible without authentication (/, /login, /signup)
 * - Protected: Require authentication (/dashboard, /reports, etc.)
 * 
 * Key principles:
 * - No client imports (server-only)
 * - No hard-coded paths (use route patterns)
 * - Explicit auth checks using Supabase
 * - Redirects unauthenticated users to /login
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Public routes that don't require authentication
 * These routes are accessible to all users
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/confirm',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  '/401',
  '/403',
  '/api/health',
  '/api/tax-rules',
  '/api/audit-log',
  '/calculators/*',
];

/**
 * Routes that should redirect authenticated users away
 * (e.g., login page when already logged in)
 */
const AUTH_ROUTES = ['/login', '/signup'];

/**
 * Check if a path matches any of the given route patterns
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    // Exact match
    if (pathname === route) return true;
    
    // Prefix match for dynamic routes (e.g., /auth/*)
    if (route.endsWith('/*') && pathname.startsWith(route.slice(0, -2))) {
      return true;
    }
    
    return false;
  });
}

/**
 * Proxy function (formerly middleware)
 * 
 * Flow:
 * 1. Check if route is public → allow access
 * 2. Check authentication status using Supabase SSR
 * 3. If authenticated and on auth route → redirect to dashboard
 * 4. If not authenticated and on protected route → redirect to login
 * 5. Otherwise → allow access
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without auth check
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware');
    // Allow request to proceed; app-level checks will handle this
    return NextResponse.next();
  }

  // Create response object to handle cookie updates
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with proper SSR cookie handling
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check authentication status
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = user !== null;

  // If authenticated and trying to access auth routes (login/signup)
  // Redirect to dashboard
  if (isAuthenticated && matchesRoute(pathname, AUTH_ROUTES)) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If not authenticated and trying to access protected route
  // Redirect to login
  if (!isAuthenticated && !matchesRoute(pathname, PUBLIC_ROUTES)) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the original destination for post-login redirect
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Return response with updated cookies
  return response;
}

/**
 * Proxy configuration
 * 
 * Matcher patterns define which routes this proxy applies to.
 * We exclude:
 * - Static files (_next/static)
 * - Images (_next/image)
 * - Favicon
 * - API routes that handle their own auth
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
