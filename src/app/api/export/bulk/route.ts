/**
 * Bulk Export API
 * POST /api/export/bulk - Export all data as ZIP
 * Protected: Requires 'export:bulk' permission
 * Rate limited: 20 requests per minute
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { createBulkExportZIP } from '@/lib/export-service';
import { withRateLimit } from '@/lib/with-rate-limit';
import { withAuth } from '@/lib/auth/with-auth';

async function handlePOST(request: NextRequest, user: any) {
  try {
    const supabase = await createClient();

    // Parse request body
    const body = await request.json();
    const { tax_year } = body;

    // Log export action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'export',
      resource_type: 'bulk_data',
      tax_year: tax_year || null,
      metadata: { format: 'zip' },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    // Generate ZIP archive
    const buffer = await createBulkExportZIP(user.id, tax_year);
    
    const filename = tax_year ? `kompleet_data_${tax_year}.zip` : 'kompleet_data_all.zip';

    // Create export history record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days TTL

    await supabase.from('export_history').insert({
      user_id: user.id,
      export_type: 'bulk',
      format: 'zip',
      tax_year: tax_year || null,
      status: 'complete',
      file_size: buffer.length,
      expires_at: expiresAt.toISOString(),
      completed_at: new Date().toISOString()
    });

    // Convert Buffer to ReadableStream for Next.js 15 + TypeScript 5.9.3 compatibility
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(buffer);
        controller.close();
      }
    });

    // Return file
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error in /api/export/bulk:', error);
    return NextResponse.json(
      { error: 'Bulk export failed' },
      { status: 500 }
    );
  }
}

// Apply authentication, authorization, and rate limiting
// Order: Auth first (check permission), then rate limit (prevent abuse)
export const POST = withRateLimit(
  withAuth(handlePOST, { requiredPermission: 'export:bulk' }),
  { limit: 20 }
);
