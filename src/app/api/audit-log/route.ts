import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      calculationType,
      inputData,
      outputData,
      ruleVersionId,
      userId,
    } = body;

    if (!calculationType || !inputData || !outputData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // If no ruleVersionId provided, get the active one
    let versionId = ruleVersionId;
    if (!versionId) {
      const { data: activeVersion } = await supabase
        .from('rule_versions')
        .select('id')
        .eq('is_active', true)
        .single();
      
      versionId = activeVersion?.id;
    }

    // Insert audit log
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        calculation_type: calculationType,
        input_data: inputData,
        output_data: outputData,
        rule_version_id: versionId,
        user_id: userId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating audit log:', error);
      return NextResponse.json(
        { error: 'Failed to create audit log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      auditLogId: data.id,
      message: 'Calculation logged successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
