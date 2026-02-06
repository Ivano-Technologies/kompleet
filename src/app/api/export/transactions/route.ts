import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { exportTransactionsCSV, exportTransactionsExcel } from '@/lib/export-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { format, tax_year } = body;

    if (!format || !['csv', 'excel'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be csv or excel' },
        { status: 400 }
      );
    }

    // Log export action
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'export',
      resource_type: 'transactions',
      tax_year: tax_year || null,
      metadata: { format },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    // Generate export
    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    if (format === 'csv') {
      buffer = await exportTransactionsCSV(user.id, tax_year);
      filename = tax_year ? `transactions_${tax_year}.csv` : 'transactions_all.csv';
      contentType = 'text/csv';
    } else {
      buffer = await exportTransactionsExcel(user.id, tax_year);
      filename = tax_year ? `transactions_${tax_year}.xlsx` : 'transactions_all.xlsx';
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Create export history record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days TTL

    await supabase.from('export_history').insert({
      user_id: user.id,
      export_type: 'transactions',
      format,
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
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error in /api/export/transactions:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
