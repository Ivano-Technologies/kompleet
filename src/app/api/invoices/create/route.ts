import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { createInvoice } from '@/lib/invoice-service';
import { withRateLimit } from '@/lib/with-rate-limit';

async function handlePOST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      tax_year,
      customer_info,
      line_items,
      invoice_date,
      due_date,
      payment_terms,
      notes
    } = body;

    // Create invoice
    const invoice = await createInvoice({
      user_id: user.id,
      tax_year,
      customer_info,
      line_items,
      invoice_date,
      due_date,
      payment_terms,
      notes
    });

    return NextResponse.json({
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePOST);
