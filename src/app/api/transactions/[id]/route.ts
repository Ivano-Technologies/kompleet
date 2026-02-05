import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(id, name, category_type, tax_treatment)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error || !transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ transaction });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const updates = await request.json();
    
    // Only allow updating specific fields
    const allowedFields = [
      'description',
      'amount',
      'transaction_type',
      'transaction_date',
      'category_id',
      'notes',
      'is_reconciled',
    ];
    
    const filteredUpdates: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }
    
    // If category was manually changed, set confidence to 100
    if (updates.category_id !== undefined) {
      filteredUpdates.confidence_score = 100;
    }
    
    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(filteredUpdates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating transaction:', error);
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      transaction,
    });
    
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting transaction:', error);
      return NextResponse.json(
        { error: 'Failed to delete transaction' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Transaction deleted',
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
