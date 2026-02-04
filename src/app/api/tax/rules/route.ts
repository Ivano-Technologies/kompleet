/**
 * Tax Rules API
 * GET /api/tax/rules - Get tax rules (optionally filtered)
 */

import { NextRequest, NextResponse } from 'next/server';
import { rulesEngine } from '@/lib/services/rules-engine';
import type { RuleType } from '@/types/tax';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const versionId = searchParams.get('version_id') || undefined;
    const ruleType = searchParams.get('rule_type') as RuleType | undefined;
    const ruleKeys = searchParams.get('rule_keys')?.split(',') || undefined;

    const response = await rulesEngine.getRules({
      version_id: versionId,
      rule_type: ruleType,
      rule_keys: ruleKeys,
    });

    if (!response) {
      return NextResponse.json(
        { error: 'Failed to fetch rules' },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/tax/rules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
