/**
 * GET /api/expenses/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=csv|pdf|excel
 * Returns expense report file (Supabase auth, RLS).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

const FORMATS = ['csv', 'pdf', 'excel'] as const;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const startDate = sp.get('startDate') ?? '';
    const endDate = sp.get('endDate') ?? '';
    const format = (sp.get('format') ?? 'csv').toLowerCase();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json(
        { error: 'startDate and endDate required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }
    if (!FORMATS.includes(format as (typeof FORMATS)[number])) {
      return NextResponse.json(
        { error: 'format must be csv, pdf, or excel' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('expenses')
      .select('id, date, amount, currency, category_id, vendor, vat_amount, notes, created_at')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    const { data: expenses, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (expenses ?? []).map((e: Record<string, unknown>) => ({
      date: e.date,
      amount: e.amount,
      currency: (e.currency as string) ?? 'NGN',
      category_id: e.category_id ?? '',
      vendor: (e.vendor as string) ?? '',
      vat_amount: e.vat_amount ?? 0,
      notes: (e.notes as string) ?? '',
    }));

    const filenameBase = `expenses_${startDate}_${endDate}`;

    if (format === 'csv') {
      const header = 'Date,Amount,Currency,Category ID,Vendor,VAT,Notes\n';
      const body = rows
        .map(
          (r) =>
            `${r.date},${r.amount},${r.currency},${r.category_id},"${String(r.vendor).replace(/"/g, '""')}",${r.vat_amount},"${String(r.notes).replace(/"/g, '""')}"`
        )
        .join('\n');
      const csv = header + body;
      const buffer = Buffer.from(csv, 'utf-8');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filenameBase}.csv"`,
          'Content-Length': String(buffer.length),
        },
      });
    }

    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Expense Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`${startDate} to ${endDate}`, 14, 28);
      autoTable(doc, {
        startY: 36,
        head: [['Date', 'Vendor', 'Amount', 'Currency', 'VAT', 'Notes']],
        body: rows.map((r) => [
          String(r.date),
          String(r.vendor).slice(0, 30),
          String(r.amount),
          r.currency,
          String(r.vat_amount),
          String(r.notes).slice(0, 40),
        ]),
      });
      const buf = doc.output('arraybuffer');
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filenameBase}.pdf"`,
          'Content-Length': String(buf.byteLength),
        },
      });
    }

    // excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Expenses');
    ws.columns = [
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Amount', key: 'amount', width: 14 },
      { header: 'Currency', key: 'currency', width: 8 },
      { header: 'Category ID', key: 'category_id', width: 38 },
      { header: 'Vendor', key: 'vendor', width: 24 },
      { header: 'VAT', key: 'vat_amount', width: 10 },
      { header: 'Notes', key: 'notes', width: 32 },
    ];
    ws.addRows(rows);
    const buffer = await wb.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filenameBase}.xlsx"`,
        'Content-Length': String(buffer.byteLength),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Export failed' },
      { status: 500 }
    );
  }
}
