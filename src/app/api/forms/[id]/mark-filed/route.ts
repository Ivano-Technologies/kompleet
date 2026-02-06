import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = params.id;
    const body = await request.json();
    const { confirmationNumber, filedDate, notes } = body;

    // Validate form ID
    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      );
    }

    // Validate confirmation number
    if (!confirmationNumber || confirmationNumber.trim() === '') {
      return NextResponse.json(
        { error: 'Confirmation number is required' },
        { status: 400 }
      );
    }

    // Verify form exists and belongs to user
    const { data: form, error: formError } = await supabase
      .from('nrs_forms')
      .select('*')
      .eq('id', formId)
      .eq('user_id', user.id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found or access denied' },
        { status: 404 }
      );
    }

    // Check if form is already filed
    const { data: existingStatus } = await supabase
      .from('filing_status')
      .select('*')
      .eq('form_id', formId)
      .eq('status', 'filed')
      .single();

    if (existingStatus) {
      return NextResponse.json(
        { error: 'Form is already marked as filed' },
        { status: 400 }
      );
    }

    // Update form status to 'filed'
    const { error: updateError } = await supabase
      .from('nrs_forms')
      .update({ status: 'filed' })
      .eq('id', formId);

    if (updateError) {
      console.error('Error updating form status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update form status' },
        { status: 500 }
      );
    }

    // Create filing status record
    const { data: filingStatus, error: statusError } = await supabase
      .from('filing_status')
      .insert({
        user_id: user.id,
        form_id: formId,
        status: 'filed',
        filed_date: filedDate || new Date().toISOString(),
        confirmation_number: confirmationNumber.trim(),
        notes: notes || null
      })
      .select()
      .single();

    if (statusError) {
      console.error('Error creating filing status:', statusError);
      return NextResponse.json(
        { error: 'Failed to create filing status record' },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from('filing_audit_logs').insert({
      user_id: user.id,
      action: 'FORM_FILED',
      form_id: formId,
      details: {
        form_type: form.form_type,
        tax_year: form.tax_year,
        confirmation_number: confirmationNumber,
        filed_date: filedDate || new Date().toISOString(),
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Form marked as filed successfully',
      filingStatus: {
        id: filingStatus.id,
        status: filingStatus.status,
        filedDate: filingStatus.filed_date,
        confirmationNumber: filingStatus.confirmation_number
      }
    });

  } catch (error) {
    console.error('Mark filed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve filing status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = params.id;

    // Fetch filing status
    const { data: filingStatus, error: dbError } = await supabase
      .from('filing_status')
      .select('*')
      .eq('form_id', formId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch filing status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      filingStatus: filingStatus || [],
      count: filingStatus?.length || 0
    });

  } catch (error) {
    console.error('Get filing status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
