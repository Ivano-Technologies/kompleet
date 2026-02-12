import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/with-rate-limit';

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { action, resource_type, resource_id, tax_year, metadata } = body;

    if (!action || !resource_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const ip_address = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // Insert audit log
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action,
        resource_type,
        resource_id: resource_id || null,
        tax_year: tax_year || null,
        metadata: metadata || {},
        ip_address,
        user_agent
      });

    if (insertError) {
      console.error('Error inserting audit log:', insertError);
      // Don't fail the request if audit logging fails
      return NextResponse.json({
        success: true,
        warning: 'Audit log failed but action completed'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/audit/log:', error);
    // Don't fail the request if audit logging fails
    return NextResponse.json({
      success: true,
      warning: 'Audit log failed but action completed'
    });
  }
}

export const POST = withRateLimit(handlePOST);
