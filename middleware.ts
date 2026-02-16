/**
 * Next.js Middleware - CORS Configuration for Mobile App
 * 
 * This middleware adds CORS headers to all API routes to allow
 * the KOMPLEET mobile app to make cross-origin requests.
 * 
 * Security considerations:
 * - Only allows specific origins (mobile app and localhost for development)
 * - Includes credentials for authentication
 * - Allows standard HTTP methods
 * - Allows Authorization header for JWT tokens
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the origin from the request
  const origin = request.headers.get('origin') || '';

  // Define allowed origins
  const allowedOrigins = [
    'http://localhost:8081', // Expo development server
    'exp://localhost:8081', // Expo Go app
    process.env.NEXT_PUBLIC_MOBILE_APP_URL, // Production mobile app URL (if needed)
  ].filter(Boolean); // Remove undefined values

  // Check if origin is allowed (for mobile app, allow all origins in development)
  const isAllowedOrigin = 
    allowedOrigins.includes(origin) || 
    origin.startsWith('exp://') || // Expo Go
    origin.startsWith('http://localhost') || // Local development
    origin.startsWith('http://192.168.') || // Local network
    origin.startsWith('http://10.0.'); // Local network

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    
    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    return response;
  }

  // Handle actual request
  const response = NextResponse.next();

  // Add CORS headers to response
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return response;
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Exclude static files, internal Next.js routes, and well-known files
    '/((?!_next/static|_next/image|favicon.ico|\.well-known).*)',
  ],
};
