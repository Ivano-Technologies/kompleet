import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { year } = body;

    if (!year || typeof year !== 'number') {
      return NextResponse.json(
        { error: 'Invalid year provided' },
        { status: 400 }
      );
    }

    // Update active year for user
    // First, set all years to inactive
    await supabase
      .from('user_tax_years')
      .update({ is_active: false })
      .eq('user_id', user.id);

    // Then, set the selected year to active
    const { error: updateError } = await supabase
      .from('user_tax_years')
      .update({ is_active: true })
      .eq('user_id', user.id)
      .eq('tax_year', year);

    if (updateError) {
      console.error('Error updating active year:', updateError);
      return NextResponse.json(
        { error: 'Failed to switch year' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      year
    });
  } catch (error) {
    console.error('Error in /api/year/switch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
