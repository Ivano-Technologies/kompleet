/**
 * Tax Sources API
 * GET /api/tax/sources - Get all regulatory sources
 * Protected: Requires 'admin:manage_rules' permission
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { rulesEngine } from '@/lib/services/rules-engine';

async function handleGET(request: NextRequest) {
  try {
    const sources = await rulesEngine.getSources();

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Error in GET /api/tax/sources:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply authentication and authorization (requires admin:manage_rules permission)
export const GET = withAuth(handleGET, { requiredPermission: 'admin:manage_rules' });
