import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's reminder history
    const { data: reminders, error: dbError } = await supabase
      .from('deadline_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('reminder_date', { ascending: false })
      .limit(50);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch reminder history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reminders: reminders || [],
      count: reminders?.length || 0
    });

  } catch (error) {
    console.error('Get reminder history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
