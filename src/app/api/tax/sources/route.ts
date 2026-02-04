/**
 * Tax Sources API
 * GET /api/tax/sources - Get all regulatory sources
 */

import { NextResponse } from 'next/server';
import { rulesEngine } from '@/lib/services/rules-engine';

export async function GET() {
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
