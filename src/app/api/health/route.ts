/**
 * Health Check API Route
 * 
 * Provides a simple endpoint to verify the application is running.
 * Used for monitoring, load balancers, and deployment verification.
 * 
 * GET /api/health
 * Returns: { status: 'ok', timestamp: ISO8601 }
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - app is running
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    // If we reach here, something is seriously wrong
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}

// Disable caching for health checks
export const dynamic = 'force-dynamic';
